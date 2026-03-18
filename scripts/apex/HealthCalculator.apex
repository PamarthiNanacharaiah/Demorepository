public class HealthCalculator {
    // Method to calculate BMI given weight in kilograms and height in meters
    public static Decimal calculateBMI(Decimal weightKg, Decimal heightM) {
        // BMI formula: BMI = weight (kg) / (height (m) ^ 2)
        Decimal bmi = weightKg / (heightM * heightM);
        return bmi;
    }
}

// Example usage
Decimal weight = 70; // 70 kg
Decimal height = 1.75; // 1.75 meters

Decimal bmi = HealthCalculator.calculateBMI(weight, height);
System.debug('Calculated BMI: ' + bmi); // Output: Calculated BMI: 22.86