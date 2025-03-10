module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            fontSize: theme("text-base"), // 기본 글자 크기 조정 (Tailwind text-base 크기 사용)
            h1: {
              fontSize: "1.65rem",
              fontWeight: "bold",
            },
            h2: {
              fontSize: "1.4rem",
              fontWeight: "bold",
            },
            h3: {
              fontSize: "1.25rem",
              fontWeight: "bold",
            },
            p: {
              fontSize: theme("text-base"),
              lineHeight: "1.6",
            },
            li: {
              fontSize: theme("text-base"),
            },
            code: {
              fontSize: theme("text-sm"),
              backgroundColor: theme("colors.gray.100"),
              padding: "2px 4px",
              borderRadius: "4px",
            },
            maxWidth: "80ch",
          },
        },
      }),
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
