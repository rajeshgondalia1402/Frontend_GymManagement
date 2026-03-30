import { Link } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Search, Home } from 'lucide-react';

export function ApplicationSuccessPage() {
  return (
    <PublicLayout>
      <div className="max-w-lg mx-auto px-4 py-16">
        <Card>
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Application Submitted!
            </h1>
            <p className="text-gray-500 mb-6">
              Thank you for registering as a trainer. Your application has been
              received and you will receive a confirmation email shortly.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-medium text-gray-700 mb-2">What happens next?</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
                  A confirmation email will be sent to your registered email
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
                  Your profile will be visible in the trainer search directory
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
                  Gym owners can discover and contact you for opportunities
                </li>
              </ul>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/hire-trainer/search" className="flex-1">
                <Button variant="outline" className="w-full gap-2">
                  <Search className="w-4 h-4" /> Search Trainers
                </Button>
              </Link>
              <Link to="/" className="flex-1">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2">
                  <Home className="w-4 h-4" /> Back to Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  );
}
