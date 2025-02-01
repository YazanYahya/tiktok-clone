import json
import math
import os
from datetime import datetime

import numpy as np
import pandas as pd
import psycopg2
import redis
from apscheduler.schedulers.blocking import BlockingScheduler
from dotenv import load_dotenv
from sklearn.metrics.pairwise import cosine_similarity

# ----------------------------------------------------------------
# 1️⃣ Database & Redis Connections
# ----------------------------------------------------------------

# Load environment variables
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

# Connect to PostgreSQL
conn = psycopg2.connect(DATABASE_URL)
cursor = conn.cursor()

# Connect to Redis
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
# 2️⃣ Fetch user-video interactions from PostgreSQL
# ----------------------------------------------------------------

def fetch_user_interactions():
    """Fetch user interactions (likes, watch time) from PostgreSQL."""
    cursor.execute("""
        SELECT user_id, 
               video_id, 
               interaction, 
               COALESCE(watch_time, 0) AS watch_time,
               timestamp
        FROM user_interactions
        WHERE interaction IN ('like', 'watch')
        ORDER BY user_id, video_id;
    """)
    return cursor.fetchall()


# ----------------------------------------------------------------
# 3️⃣ Apply Time Decay
# ----------------------------------------------------------------

def apply_time_decay(interaction_score, interaction_time, decay_rate=0.01):
    """
    Apply time decay to older interactions.
    - Newer interactions have a higher impact.
    - Older interactions get lower scores.
    """
    current_time = datetime.now()
    time_diff = (current_time - interaction_time).days  # Time difference in days
    decay_weight = math.exp(-decay_rate * time_diff)  # Apply exponential decay
    return interaction_score * decay_weight  # Adjusted score


# ----------------------------------------------------------------
# 4️⃣ Compute User Ratings
# ----------------------------------------------------------------

def compute_rating(interaction, watch_time, interaction_time):
    """
    Convert user interactions into a rating score.
    - Likes = 5.0 (Maximum score)
    - Watch time is scaled to a 0-3 range.
    - Time decay is applied to older interactions.
    """
    if interaction == 'like':
        base_score = 5.0
    else:
        base_score = min((watch_time / 30) * 3, 3.0)  # Scale watch time to [0,3]

    return apply_time_decay(base_score, interaction_time)  # Apply time decay


# ----------------------------------------------------------------
# 5️⃣ Predict Ratings using Collaborative Filtering
# ----------------------------------------------------------------

def predict_rating(user_id, target_video_id, user_video_matrix, similarity_df, k=3):
    """
    Predict a user's rating for a target video using item-based collaborative filtering.
    """
    user_ratings = user_video_matrix.loc[user_id]
    sim_scores = similarity_df[target_video_id]

    rated_videos = user_ratings[user_ratings > 0].index
    rated_videos = rated_videos[rated_videos != target_video_id]

    sim_scores_for_rated = sim_scores[rated_videos].sort_values(ascending=False)
    top_videos = sim_scores_for_rated.head(k).index
    top_similarities = sim_scores_for_rated.head(k).values
    top_ratings = user_ratings[top_videos].values

    numerator = np.dot(top_similarities, top_ratings)
    denominator = np.sum(top_similarities)

    return numerator / denominator if denominator != 0 else 0.0


# ----------------------------------------------------------------
# 6️⃣ Generate Recommendations
# ----------------------------------------------------------------

def get_recommendations_for_user(user_id, user_video_matrix, similarity_df, k=3, top_n=5):
    """
    Get top-N video recommendations for a user.
    """
    user_ratings = user_video_matrix.loc[user_id]
    videos_not_rated = user_ratings[user_ratings == 0].index  # Get videos the user has NOT rated

    predictions = []
    for video_id in videos_not_rated:
        predicted_score = predict_rating(user_id, video_id, user_video_matrix, similarity_df, k=k)
        predictions.append((video_id, predicted_score))

    predictions.sort(key=lambda x: x[1], reverse=True)  # Sort by predicted score
    return predictions[:top_n]


# ----------------------------------------------------------------
# 7️⃣ Main Function to Generate Recommendations
# ----------------------------------------------------------------

def generate_recommendations():
    """
    Fetch interactions, compute ratings, generate recommendations, and store in Redis.
    """
    try:
        interactions = fetch_user_interactions()

        df = pd.DataFrame(interactions, columns=['User ID', 'Video ID', 'Interaction', 'Watch Time', 'Timestamp'])

        df['Rating'] = df.apply(
            lambda row: compute_rating(row['Interaction'], row['Watch Time'], row['Timestamp']),
            axis=1
        )

        user_video_matrix = df.pivot_table(index='User ID', columns='Video ID', values='Rating', aggfunc='mean') \
            .fillna(0)

        matrix_values = user_video_matrix.values
        video_similarity = cosine_similarity(matrix_values.T)  # Compute item-based similarity

        video_ids = user_video_matrix.columns
        similarity_df = pd.DataFrame(video_similarity, index=video_ids, columns=video_ids)

        all_users = user_video_matrix.index
        for user in all_users:
            recs = get_recommendations_for_user(user, user_video_matrix, similarity_df, k=5, top_n=5)
            store_recommendations_in_redis(user, recs)

        print("[INFO] Successfully generated & stored recommendations.")

    except Exception as e:
        print("[ERROR] generate_recommendations failed:", e)


# ----------------------------------------------------------------
# 8️⃣ Store Recommendations in Redis
# ----------------------------------------------------------------

def store_recommendations_in_redis(user_id, recs):
    """
    Store recommendations in Redis for fast retrieval.
    """
    data = [{"video_id": vid, "score": float(score)} for vid, score in recs]
    key = f"recommendations:{user_id}"
    r.set(key, json.dumps(data, indent=2))
    print(f"[DEBUG] Stored recommendations for user {user_id} in Redis under key '{key}'.")


# ----------------------------------------------------------------
# 9️⃣ Schedule Recommendation Generation
# ----------------------------------------------------------------

def schedule_recommendations():
    """
    Schedule the recommendation generation to run every 5 minutes.
    """
    scheduler = BlockingScheduler()
    scheduler.add_job(generate_recommendations, 'interval', minutes=3)
    print("[SCHEDULER] Starting job every 3 minutes. Press Ctrl+C to exit.")
    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        pass


# ----------------------------------------------------------------
# 🔟 Main Execution
# ----------------------------------------------------------------

if __name__ == "__main__":
    schedule_recommendations()
    # Close connection on exit
    cursor.close()
    conn.close()
