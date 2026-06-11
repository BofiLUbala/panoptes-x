import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

interface AppLogoProps {
  size?: number;
  style?: StyleProp<ImageStyle>;
}

const logoSource = require('../../assets/panoptes-x-logo.png');

const AppLogo: React.FC<AppLogoProps> = ({ size = 96, style }) => (
  <Image
    source={logoSource}
    resizeMode="contain"
    style={[{ width: size, height: size }, style]}
  />
);

export default AppLogo;
