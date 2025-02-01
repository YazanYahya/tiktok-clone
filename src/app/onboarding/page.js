"use client"

import {useState} from "react"
import {useRouter} from "next/navigation"
import {Button} from "@/components/ui/button"
import {motion} from "framer-motion"
import {useUser} from "@clerk/nextjs";
import {completeOnboarding} from "@/app/onboarding/actions";
import {INTERESTS} from "@/constants/interests";

export default function OnboardingPage() {
    const {user} = useUser()
    const router = useRouter()
    const [selectedInterests, setSelectedInterests] = useState([])

    const toggleInterest = (interest) => {
        setSelectedInterests((prev) => (prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]))
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        await completeOnboarding(selectedInterests)
        await user?.reload()
        router.push('/feed')
    }

    return (
        <div
            className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
            <motion.div
                initial={{opacity: 0, y: -20}}
                animate={{opacity: 1, y: 0}}
                transition={{duration: 0.5}}
                className="text-center mb-8"
            >
                <h1 className="text-4xl font-bold mb-2">Welcome to TikTok Clone</h1>
                <p className="text-xl">Choose your interests to personalize your feed</p>
            </motion.div>
            <form onSubmit={handleSubmit} className="w-full max-w-3xl">
                <div className="grid grid-cols-3 md:grid-cols-4 gap-4 mb-8">
                    {INTERESTS.map((interest, index) => (
                        <motion.div
                            key={interest}
                            initial={{opacity: 0, scale: 0.8}}
                            animate={{opacity: 1, scale: 1}}
                            transition={{duration: 0.3, delay: index * 0.05}}
                        >
                            <Button
                                type="button"
                                variant={selectedInterests.includes(interest) ? "default" : "outline"}
                                onClick={() => toggleInterest(interest)}
                                className="w-full h-16 text-lg font-semibold"
                            >
                                {interest}
                            </Button>
                        </motion.div>
                    ))}
                </div>
                <motion.div initial={{opacity: 0}} animate={{opacity: 1}} transition={{duration: 0.5, delay: 0.5}}>
                    <Button type="submit" className="w-full py-6 text-xl font-bold"
                            disabled={selectedInterests.length === 0}>
                        Get Started
                    </Button>
                </motion.div>
            </form>
        </div>
    )
}