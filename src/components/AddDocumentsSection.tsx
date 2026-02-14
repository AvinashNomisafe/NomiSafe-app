import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ImageSourcePropType,
} from 'react-native';
import { colors, spacing, typography } from '../constants/theme';

interface DocumentItem {
  id: number | string;
  title: string;
  icon: ImageSourcePropType;
}

interface AddDocumentsSectionProps {
  items?: DocumentItem[];
  onItemPress?: (item: DocumentItem) => void;
}

const DEFAULT_ITEMS: DocumentItem[] = [
  {
    id: 1,
    title: 'Health\nInsurance',
    icon: require('../assets/icons/healthInsuranceIcon.png'),
  },
  {
    id: 2,
    title: 'Life\nInsurance',
    icon: require('../assets/icons/lifeInsuranceIcon.png'),
  },
  {
    id: 4,
    title: 'Car\nInsurance',
    icon: require('../assets/icons/carInsuranceIcon.png'),
  },
  {
    id: 5,
    title: 'Properties',
    icon: require('../assets/icons/propertiesIconNew.png'),
  },
];

const AddDocumentsSection: React.FC<AddDocumentsSectionProps> = ({
  items = DEFAULT_ITEMS,
  onItemPress,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add You Documents</Text>

      <View style={styles.grid}>
        {items.map(item => (
          <TouchableOpacity
            key={item.id}
            style={styles.item}
            activeOpacity={0.85}
            onPress={() => onItemPress?.(item)}
            accessibilityRole="button"
            accessibilityLabel={item.title.replace('\n', ' ')}
          >
            <View style={styles.iconCircle}>
              <Image
                source={item.icon}
                style={styles.icon}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.itemLabel}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.background.white,
  },
  title: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.normal,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  item: {
    width: '25%',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 999,
    backgroundColor: '#E8F4F4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  icon: {
    width: 32,
    height: 32,
  },
  itemLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default AddDocumentsSection;
