const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Parse a weekday from a string, returning the standardized name and index of the date or undefined if the
// input is invalid.
export function dayToNumber(day: string) {
    const index = days.findIndex(d => d.toLowerCase() === day.toLowerCase());
    if (index !== -1) return {name: days[index], num: index};
}
