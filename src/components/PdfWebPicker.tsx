import React from 'react';
import { View } from 'react-native';

// Minimal stub component kept for compatibility. The project is Android-only for
// the PDF picker flow, so this component intentionally renders nothing and avoids
// importing iOS-only/native webview/file-access packages.
const PdfWebPicker: React.FC<any> = () => {
  return <View />;
};

export default PdfWebPicker;
