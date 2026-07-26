import colors from '@/constants/colors';
import { useAppTheme } from '@/context/theme-context';

export function useColors() {
  const { theme } = useAppTheme();
  return colors[theme];
}
