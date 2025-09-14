"use client"

import React from 'react'
import { Button } from './ui/button'
import { userSignOut } from '@/actions/action'
import { useRouter } from 'next/navigation'

const SignoutBtn = () => {
    const router = useRouter();
    const handleSignout = async () => {
        await userSignOut();
        router.push('/')
    }
    return (
        <Button onClick={handleSignout}>
            logout
        </Button>
    )
}

export default SignoutBtn