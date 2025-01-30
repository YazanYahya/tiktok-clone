'use server'

import {auth, clerkClient} from '@clerk/nextjs/server'
import {updateUserInterests} from "@/services/userService";

export const completeOnboarding = async (selectedInterests) => {
    const client = await clerkClient()
    const {userId} = await auth()

    if (!userId) {
        return {message: 'No Logged In User'}
    }

    try {
        await client.users.updateUser(userId, {
            publicMetadata: {
                onboardingComplete: true
            },
        });

        await updateUserInterests(userId, selectedInterests);

        return {message: 'User metadata Updated'}
    } catch (e) {
        console.log('error', e)
        return {message: 'Error Updating User Metadata'}
    }
}