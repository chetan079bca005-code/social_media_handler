import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Loader2, ArrowLeft, CheckCircle } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import toast from 'react-hot-toast'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim()) {
      toast.error('Please enter your email address')
      return
    }

    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      setIsSubmitted(true)
    }, 1500)
  }

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md text-center"
      >
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Check your email</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          We've sent a password reset link to
        </p>
        <p className="text-indigo-600 font-medium mt-1">{email}</p>

        <div className="mt-8 space-y-4">
          <p className="text-sm text-slate-500">
            Didn't receive the email? Check your spam folder or
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setIsSubmitted(false)
              handleSubmit({ preventDefault: () => {} } as React.FormEvent)
            }}
            className="w-full"
          >
            Resend Email
          </Button>
        </div>

        <Link
          to="/auth/login"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mt-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to sign in
        </Link>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md"
    >
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl font-bold text-white">SM</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Forgot password?</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          No worries, we'll send you reset instructions.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Email Address
          </label>
          <div className="relative mt-1.5">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="pl-10"
              disabled={isLoading}
            />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            'Reset Password'
          )}
        </Button>
      </form>

      <Link
        to="/auth/login"
        className="items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mt-8 mx-auto block text-center"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to sign in
      </Link>
    </motion.div>
  )
}
