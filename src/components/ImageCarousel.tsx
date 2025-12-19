import React, { useState, useRef } from 'react';
import {
  View,
  ScrollView,
  Image,
  StyleSheet,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ImageSourcePropType,
} from 'react-native';

interface CarouselImage {
  id: string;
  source: ImageSourcePropType;
  title: string;
}

interface ImageCarouselProps {
  images?: CarouselImage[];
}

const { width } = Dimensions.get('window');
const CAROUSEL_WIDTH = width - 32; // Full width minus spacing

const ImageCarousel: React.FC<ImageCarouselProps> = ({
  images = [
    {
      id: '1',
      source: require('../assets/images/marketing_1.png'),
      title: 'Marketing 1',
    },
    {
      id: '2',
      source: require('../assets/images/marketing_2.png'),
      title: 'Marketing 2',
    },
    {
      id: '3',
      source: require('../assets/images/marketing_3.png'),
      title: 'Marketing 3',
    },
  ],
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffsetX / CAROUSEL_WIDTH);
    setActiveIndex(currentIndex);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {images.map(image => (
          <View key={image.id} style={styles.slide}>
            <Image
              source={image.source}
              style={styles.image}
              resizeMode="contain"
            />
          </View>
        ))}
      </ScrollView>

      {/* Dot Indicators */}
      <View style={styles.dotsContainer}>
        {images.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === activeIndex ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  scrollView: {
    height: 200,
  },
  slide: {
    width: CAROUSEL_WIDTH,
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 16,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: '#4DB6AC',
    width: 24,
  },
  dotInactive: {
    backgroundColor: '#d0d0d0',
  },
});

export default ImageCarousel;
