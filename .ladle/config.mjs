/** @type {import('@ladle/react').UserConfig} */
export default {
  stories: "src/**/*.stories.{tsx,jsx}",
  addons: {
    width: {
      enabled: true,
      options: {
        xsmall: 320,
        small: 375,
        medium: 768,
        large: 1024,
      },
      defaultState: "small",
    },
  },
};
