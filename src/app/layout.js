import {ClerkProvider} from "@clerk/nextjs";
import "./globals.css";

export default function RootLayout({children}) {
    return (
        <html lang="en">
        <ClerkProvider
            appearance={{
                variables: {colorPrimary: "#000000"},
                elements: {
                    formButtonPrimary:
                        "bg-black border border-black border-solid hover:bg-white hover:text-black",
                    socialButtonsBlockButton:
                        "bg-white border-gray-200 hover:bg-transparent hover:border-black text-gray-600 hover:text-black",
                    socialButtonsBlockButtonText: "font-semibold",
                    formButtonReset:
                        "bg-white border border-solid border-gray-200 hover:bg-transparent hover:border-black text-gray-500 hover:text-black",
                    membersPageInviteButton:
                        "bg-black border border-black border-solid hover:bg-white hover:text-black",
                    card: "bg-[#fafafa]",
                },
            }}
        >
            <body className={`min-h-screen flex flex-col antialiased`}>
            {children}
            </body>
        </ClerkProvider>
        </html>
    );
}