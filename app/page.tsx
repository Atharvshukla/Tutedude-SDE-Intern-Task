"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/dashboard');
      }
      setIsLoading(false);
    };
    
    checkSession();
  }, [router, supabase.auth]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center text-center space-y-8">
          <div className="rounded-full bg-primary/10 p-4">
            <GraduationCap className="h-12 w-12 text-primary" />
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Smart Video Learning Platform
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl">
            Track your learning progress intelligently. Our platform ensures you get credit only for the unique parts of videos you watch.
          </p>

          <div className="flex gap-4">
            <Link href="/login">
              <Button size="lg">Get Started</Button>
            </Link>
            <Link href="/courses">
              <Button size="lg" variant="outline">Browse Courses</Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-16 w-full max-w-5xl">
            <Card>
              <CardHeader>
                <CardTitle>Smart Progress</CardTitle>
                <CardDescription>Only unique views count towards progress</CardDescription>
              </CardHeader>
              <CardContent>
                Track real progress with our intelligent system that only counts new content watched.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resume Anywhere</CardTitle>
                <CardDescription>Continue where you left off</CardDescription>
              </CardHeader>
              <CardContent>
                Your progress is saved automatically. Pick up exactly where you stopped, on any device.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detailed Analytics</CardTitle>
                <CardDescription>Track your learning journey</CardDescription>
              </CardHeader>
              <CardContent>
                Get insights into your learning patterns and track completion across all courses.
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}