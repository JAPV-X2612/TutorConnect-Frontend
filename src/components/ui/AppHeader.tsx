/**
 * @file AppHeader.tsx
 * @description Shared top navigation bar with the TutorConnect brand logo.
 * @author TutorConnect Team
 */

import { Text, View } from 'react-native';
import { BrandLogoIcon } from './BrandLogoIcon';

const PRIMARY = '#006A75';
const DARK = '#0D2B22';

interface AppHeaderProps {
  /** Content rendered on the right side of the bar (e.g. bell icon or screen title). */
  right?: React.ReactNode;
}

/**
 * Top bar shared across tutor screens.
 * Left side always shows the brand logo; right side is a slot for contextual content.
 *
 * @example
 * // Dashboard — notification bell
 * <AppHeader right={<BellButton />} />
 *
 * // Profile — screen title
 * <AppHeader right={<Text>Mi perfil</Text>} />
 */
export function AppHeader({ right }: AppHeaderProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 4,
        backgroundColor: '#FFFFFF',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            backgroundColor: PRIMARY,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <BrandLogoIcon color="#FFFFFF" size={22} />
        </View>
        <Text style={{ fontSize: 17, fontWeight: '700', color: DARK }}>TutorConnect</Text>
      </View>

      {right ?? null}
    </View>
  );
}
