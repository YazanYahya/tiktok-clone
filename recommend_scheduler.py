import json
import os

import numpy as np
import pandas as pd
import psycopg2
import redis
from apscheduler.schedulers.blocking import BlockingScheduler
from dotenv import load_dotenv
from sklearn.metrics.pairwise import cosine_similarity

# ----------------------------------------------------------------
# 1) Database & Redis Connections
# ----------------------------------------------------------------
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

# Connect to Postgres
conn = psycopg2.connect(DATABASE_URL)
cursor = conn.cursor()

# Connect to Upstash Redis using standard Redis client
REDIS_HOST = os.getenv("REDIS_HOST")
REDIS_PORT = os.getenv("REDIS_PORT")
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD")

r = redis.Redis(
    host=REDIS_HOST,
    port=REDIS_PORT,
    password=REDIS_PASSWORD,
    ssl=True
)


# ----------------------------------------------------------------
# 2) Fetch user-video interactions from Postgres
# ----------------------------------------------------------------
def fetch_user_interactions():
    """
    Fetch user-video interactions focusing on 'like' or 'watch' from Postgres.
    Returns a list of tuples: (user_id, video_id, interaction, watch_time)
    """
    cursor.execute("""
        SELECT user_id, 
               video_id, 
               interaction, 
               COALESCE(watch_time, 0) AS watch_time
        FROM user_interactions
        WHERE interaction IN ('like', 'watch')
        ORDER BY user_id, video_id;
    """)
    rows = cursor.fetchall()
    return rows


# ----------------------------------------------------------------
# 3) Rating Function
# ----------------------------------------------------------------
def compute_rating(interaction, watch_time):
    """
    Converts interaction data (like or watch_time) into a rating.
      - 'like' => 5
      - 'watch' => scale watch_time (seconds) to 0–3 range, capped at 3
    """
    if interaction == 'like':
        return 5.0
    # Scale watch_time (seconds) to a 0–3 range
    rating = (watch_time / 30) * 3
    return min(rating, 3.0)


# ----------------------------------------------------------------
# 4) Prediction & Recommendation Functions
# ----------------------------------------------------------------
def predict_rating(user_id, target_video_id, user_video_matrix, similarity_df, k=3):
    """
    Predict how user_id would rate target_video_id using item-based CF (cosine similarity).
    We look at the top K videos that are most similar to target_video_id and
    for which the user has a nonzero rating.
    """
    # User's row of ratings
    user_ratings = user_video_matrix.loc[user_id]

    # Similarities for the target video vs. all other videos
    sim_scores = similarity_df[target_video_id]

    # Filter out videos the user hasn't rated (rating == 0)
    # and the target video itself
    rated_videos = user_ratings[user_ratings > 0].index
    rated_videos = rated_videos[rated_videos != target_video_id]

    # Similarity scores for the videos the user has rated
    sim_scores_for_rated = sim_scores[rated_videos].sort_values(ascending=False)

    # Take the top K similar videos
    top_videos = sim_scores_for_rated.head(k).index
    top_similarities = sim_scores_for_rated.head(k).values

    # Ratings given by the user to these top videos
    top_ratings = user_ratings[top_videos].values

    # Calculate weighted average
    numerator = np.dot(top_similarities, top_ratings)
    denominator = np.sum(top_similarities)

    if denominator == 0:
        return 0.0  # If there's no similarity, predict 0

    return numerator / denominator


def get_recommendations_for_user(user_id, user_video_matrix, similarity_df, k=3, top_n=3):
    """
    Get the top-N recommended videos for user_id using item-based CF (cosine similarity).
    k: number of similar items to consider in rating prediction
    top_n: how many videos to recommend
    """
    # Get all the user's current ratings
    user_ratings = user_video_matrix.loc[user_id]

    # Identify videos this user has not rated (i.e., rating == 0)
    videos_not_rated = user_ratings[user_ratings == 0].index

    # Predict ratings for these videos
    predictions = []
    for video_id in videos_not_rated:
        predicted_score = predict_rating(user_id, video_id, user_video_matrix, similarity_df, k=k)
        predictions.append((video_id, predicted_score))

    # Sort by predicted score
    predictions.sort(key=lambda x: x[1], reverse=True)

    # Return top-N
    return predictions[:top_n]


# ----------------------------------------------------------------
# 5) Generate Recommendations
# ----------------------------------------------------------------
def generate_recommendations():
    """
    Main function that:
      1) Fetches interactions from Postgres
      2) Writes them to an Excel file (optional)
      3) Builds user-video matrix & computes cosine similarity
      4) Generates top recommendations for each user
    """
    try:
        # Fetch data
        interactions = fetch_user_interactions()

        # Convert to DataFrame
        df = pd.DataFrame(interactions, columns=['User ID', 'Video ID', 'Interaction', 'Watch Time'])

        # Compute ratings
        df['Rating'] = df.apply(
            lambda row: compute_rating(row['Interaction'], row['Watch Time']),
            axis=1
        )

        # Build user-video matrix
        user_video_matrix = df.pivot_table(
            index='User ID',
            columns='Video ID',
            values='Rating',
            aggfunc='mean'
        ).fillna(0)

        # Compute item-based cosine similarity
        matrix_values = user_video_matrix.values
        video_similarity = cosine_similarity(matrix_values.T)

        # Convert similarity to a DataFrame for easier indexing
        video_ids = user_video_matrix.columns
        similarity_df = pd.DataFrame(video_similarity, index=video_ids, columns=video_ids)

        # Generate and store recommendations in Redis
        all_users = user_video_matrix.index
        for user in all_users:
            recs = get_recommendations_for_user(
                user_id=user,
                user_video_matrix=user_video_matrix,
                similarity_df=similarity_df,
                k=3,  # top-3 similar items in rating prediction
                top_n=3  # recommend top-3 videos
            )
            store_recommendations_in_redis(user, recs)

        print("[INFO] Successfully generated & stored recommendations.")

    except Exception as e:
        print("[ERROR] generate_recommendations failed:", e)


# ----------------------------------------------------------------
# 6) Save to Redis
# ----------------------------------------------------------------
def store_recommendations_in_redis(user_id, recs):
    """
    Store the given recommendations in Redis as JSON.

    :param user_id: the user identifier
    :param recs: a list of (video_id, score) tuples
    """
    # Convert list of tuples -> list of dicts -> JSON string
    data = [{"video_id": vid, "score": float(score)} for vid, score in recs]

    key = f"recommendations:{user_id}"
    r.set(key, json.dumps(data, indent=2))  # indent=2 for readability
    print(f"[DEBUG] Stored recommendations for user {user_id} in Redis under key '{key}'.")


# ----------------------------------------------------------------
# Schedule the job
# ----------------------------------------------------------------
def schedule_recommendations():
    """
    Schedule the 'generate_recommendations' job to run every 5 minutes.
    """
    scheduler = BlockingScheduler()
    scheduler.add_job(generate_recommendations, 'interval', minutes=5)
    print("[SCHEDULER] Starting job every 1 minute. Press Ctrl+C to exit.")
    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        pass


# ----------------------------------------------------------------
# Main
# ----------------------------------------------------------------
if __name__ == "__main__":
    schedule_recommendations()
    # Close connection on exit
    cursor.close()
    conn.close()
