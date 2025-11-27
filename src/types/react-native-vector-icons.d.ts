declare module 'react-native-vector-icons/MaterialCommunityIcons' {
  import { Component } from 'react';
  import { TextStyle, StyleProp } from 'react-native';
  interface IconProps {
    name: string;
    size?: number;
    color?: string;
    style?: StyleProp<TextStyle>;
  }
  export default class MaterialCommunityIcons extends Component<IconProps> {}
}

declare module 'react-native-vector-icons/Entypo' {
  import { Component } from 'react';
  import { TextStyle, StyleProp } from 'react-native';
  interface IconProps {
    name: string;
    size?: number;
    color?: string;
    style?: StyleProp<TextStyle>;
  }
  export default class Entypo extends Component<IconProps> {}
}

declare module 'react-native-vector-icons/Ionicons' {
  import { Component } from 'react';
  import { TextStyle, StyleProp } from 'react-native';
  interface IconProps {
    name: string;
    size?: number;
    color?: string;
    style?: StyleProp<TextStyle>;
  }
  export default class Ionicons extends Component<IconProps> {}
}
