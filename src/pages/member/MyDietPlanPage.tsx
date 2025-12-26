import { useQuery } from '@tanstack/react-query';
import { UtensilsCrossed, Flame, Apple } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { memberService } from '@/services/member.service';

export function MyDietPlanPage() {
  const { data: dietPlan, isLoading } = useQuery({
    queryKey: ['my-diet-plan'],
    queryFn: memberService.getDietPlan,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Diet Plan</h1>
        <p className="text-muted-foreground">Your personalized nutrition plan</p>
      </div>

      {dietPlan ? (
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UtensilsCrossed className="h-6 w-6 text-primary" />
                  <CardTitle>{dietPlan.name}</CardTitle>
                </div>
                <Badge variant={dietPlan.isActive ? 'default' : 'secondary'}>
                  {dietPlan.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <CardDescription>{dietPlan.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {dietPlan.meals && typeof dietPlan.meals === 'object' && (
                <div className="space-y-4">
                  <h4 className="font-semibold">Meal Plan</h4>
                  {(dietPlan.meals as { notes?: string[] }).notes?.map((meal, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                      <Apple className="h-5 w-5 text-green-600 mt-0.5" />
                      <span>{meal}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                Daily Target
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-5xl font-bold text-primary">{dietPlan.calories || '-'}</p>
                <p className="text-muted-foreground mt-2">calories per day</p>
              </div>
              <div className="mt-6 space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Plan Type</span>
                  <span className="font-medium">{dietPlan.name}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium text-green-600">Active</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UtensilsCrossed className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold">No Diet Plan Assigned</h3>
            <p className="text-muted-foreground text-center max-w-md mt-2">
              You don't have a diet plan assigned yet. Contact your gym owner or trainer to get a personalized diet plan.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
