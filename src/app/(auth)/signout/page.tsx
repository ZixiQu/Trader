"use client";

import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

export default function SignOutPage() {
    const [message, setMessage] = useState('Signing you out...');
    const router = useRouter();
    const { data: session } = useSession();

    useEffect(() => {
        if (!session) {
            setMessage('You are not signed in.');
            return;
        }

        async function doSignOut() {
            await signOut({ redirect: false });
            setMessage('Signed out successfully!');
            router.refresh(); // reload session
            router.push('/'); // redirect
        }

        doSignOut();
    }, [router, session]);

    return (
        <div className="p-6">
            <h1 className="text-2xl font-semibold">{message}</h1>
        </div>
    );
}