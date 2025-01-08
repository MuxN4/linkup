import { Button } from '@/components/ui/button'
import Link from 'next/link'
 
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center">
      <img 
        src="/not_found.png" 
        alt="Not Found" 
        className="w-1/2 max-w-sm -ml-14" 
      />
      <Link href="/">
        <Button className="mt-4">
          Return Home
        </Button>
      </Link>
    </div>
  )
}