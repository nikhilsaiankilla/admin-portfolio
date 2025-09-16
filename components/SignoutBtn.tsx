"use client"

import React, { useState } from 'react'
import { Button } from './ui/button'
import { userSignOut } from '@/actions/action'
import { useRouter } from 'next/navigation'
import { Loader } from 'lucide-react'

const SignoutBtn = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleSignout = async () => {
        setLoading(true)
        await userSignOut();
        router.push('/')
        setLoading(false)
    }
    return (
        <Button onClick={handleSignout} className='cursor-pointer'>
            {loading ? <Loader size={8} className='animate-spin text-white'/> : "logout"}
        </Button>
    )
}

export default SignoutBtn