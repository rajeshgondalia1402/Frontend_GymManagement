import { useState } from 'react';
import { Calculator, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BMICalculatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface BMIResult {
  bmi: number;
  category: string;
  color: string;
}

export function BMICalculator({ open, onOpenChange }: BMICalculatorProps) {
  const [height, setHeight] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [gender, setGender] = useState<string>('');
  const [result, setResult] = useState<BMIResult | null>(null);

  const getBMICategory = (bmi: number): { category: string; color: string } => {
    if (bmi < 18.5) {
      return { category: 'Underweight', color: 'text-blue-600 bg-blue-50' };
    } else if (bmi >= 18.5 && bmi <= 24.9) {
      return { category: 'Normal', color: 'text-green-600 bg-green-50' };
    } else if (bmi >= 25 && bmi <= 29.9) {
      return { category: 'Overweight', color: 'text-yellow-600 bg-yellow-50' };
    } else if (bmi >= 30 && bmi <= 34.9) {
      return { category: 'Obesity (Class 1)', color: 'text-orange-600 bg-orange-50' };
    } else if (bmi >= 35 && bmi <= 39.9) {
      return { category: 'Obesity (Class 2)', color: 'text-red-600 bg-red-50' };
    } else {
      return { category: 'Extreme Obesity', color: 'text-red-700 bg-red-100' };
    }
  };

  const calculateBMI = () => {
    const heightNum = parseFloat(height);
    const weightNum = parseFloat(weight);

    if (!heightNum || !weightNum || heightNum <= 0 || weightNum <= 0) {
      return;
    }

    // Convert height from cm to meters
    const heightInMeters = heightNum / 100;
    const bmi = weightNum / (heightInMeters * heightInMeters);
    const { category, color } = getBMICategory(bmi);

    setResult({
      bmi: parseFloat(bmi.toFixed(2)),
      category,
      color,
    });
  };

  const handleReset = () => {
    setHeight('');
    setWeight('');
    setGender('');
    setResult(null);
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
              <Calculator className="h-5 w-5 text-white" />
            </div>
            BMI Calculator
          </DialogTitle>
          <DialogDescription>
            Calculate your Body Mass Index (BMI) and understand your health category.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Height Input */}
          <div className="space-y-2">
            <Label htmlFor="height" className="text-sm font-semibold">
              Height (cm) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="height"
              type="number"
              placeholder="e.g., 170"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="h-11"
              min="1"
            />
          </div>

          {/* Weight Input */}
          <div className="space-y-2">
            <Label htmlFor="weight" className="text-sm font-semibold">
              Weight (kg) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="weight"
              type="number"
              placeholder="e.g., 75"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="h-11"
              min="1"
            />
          </div>

          {/* Gender Select */}
          <div className="space-y-2">
            <Label htmlFor="gender" className="text-sm font-semibold">
              Gender (Optional)
            </Label>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Calculate Button */}
          <Button
            onClick={calculateBMI}
            className="w-full h-11 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            disabled={!height || !weight}
          >
            <Calculator className="h-4 w-4 mr-2" />
            Calculate BMI
          </Button>

          {/* Result Display */}
          {result && (
            <div className="mt-4 p-4 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border-2 border-purple-200">
              <div className="text-center space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground font-medium mb-1">Your BMI</p>
                  <p className="text-4xl font-bold text-purple-700">{result.bmi}</p>
                </div>

                <div className={`px-4 py-2 rounded-lg ${result.color} inline-block`}>
                  <p className="text-sm font-bold">{result.category}</p>
                </div>

                {/* BMI Range Reference */}
                <div className="mt-4 pt-4 border-t border-purple-200">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">BMI Categories:</p>
                  <div className="space-y-1 text-xs text-left">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{'< 18.5'}</span>
                      <span className="text-blue-600 font-medium">Underweight</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">18.5 – 24.9</span>
                      <span className="text-green-600 font-medium">Normal</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">25 – 29.9</span>
                      <span className="text-yellow-600 font-medium">Overweight</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">30 – 34.9</span>
                      <span className="text-orange-600 font-medium">Obesity (Class 1)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">35 – 39.9</span>
                      <span className="text-red-600 font-medium">Obesity (Class 2)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{'>= 40'}</span>
                      <span className="text-red-700 font-medium">Extreme Obesity</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground italic mt-3">
                  Note: BMI does not measure body fat directly. Consult a healthcare professional for personalized advice.
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            {result && (
              <Button
                onClick={handleReset}
                variant="outline"
                className="flex-1 h-10"
              >
                Reset
              </Button>
            )}
            <Button
              onClick={handleClose}
              variant="outline"
              className="flex-1 h-10"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
