/**
 * MenuGrid Component
 * Reusable grid menu for navigation items
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ImageSourcePropType,
} from 'react-native';
import { colors, spacing, typography } from '../../constants/theme';

interface MenuItem {
  id: number | string;
  title: string;
  icon: ImageSourcePropType;
  route: string;
}

interface MenuGridProps {
  items: MenuItem[];
  onItemPress: (route: string) => void;
  columns?: number;
}

const MenuGrid: React.FC<MenuGridProps> = ({
  items,
  onItemPress,
  columns = 4,
}) => {
  const itemWidth = `${100 / columns}%` as const;

  return (
    <View style={styles.container}>
      {items.map(item => (
        <TouchableOpacity
          key={item.id}
          style={[styles.item, { width: itemWidth as any }]}
          onPress={() => onItemPress(item.route)}
        >
          <View style={styles.iconContainer}>
            <Image
              source={item.icon}
              style={styles.icon}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>{item.title}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.xs,
    backgroundColor: colors.common.white,
    marginHorizontal: 'auto',
    width: '95%',
    boxShadow: '0px 5px 4.2px 0px #DBDBDB40',
    marginTop: 10,
    elevation: 1,
    padding: spacing.md,
    borderRadius: 4,
  },
  item: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: '#F7F5FA7D',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  icon: {
    width: 40,
    height: 40,
  },
  title: {
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
    color: colors.text.primary,
  },
});

export default MenuGrid;
