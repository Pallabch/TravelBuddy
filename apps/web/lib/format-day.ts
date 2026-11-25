const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Fixed month names keep the server and browser output identical, which
// toLocaleDateString does not.
export function formatDay(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return `${day} ${months[(month ?? 1) - 1]} ${year}`;
}
