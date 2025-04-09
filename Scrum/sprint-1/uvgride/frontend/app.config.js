import 'dotenv/config';

export default {
  expo: {
    name: "UVGride",
    slug: "uvgride",
    version: "1.0.0",
    scheme: "uvgride",
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL,
    },
  },
};