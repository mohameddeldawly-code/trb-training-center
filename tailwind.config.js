/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // الهوية البصرية — مستلهمة من شعار ترسانة الإسكندرية (كحلي بحري · أحمر · ذهبي)
        navy:   { 50:'#eef4fb',100:'#d6e5f5',200:'#adcaea',300:'#7ba7db',400:'#4a80c7',
                  500:'#2b60a8',600:'#1f4a86',700:'#17386a',800:'#102a51',900:'#0a1c38',950:'#061125' },
        steel:  { 50:'#f5f7fa',100:'#e9edf3',200:'#d3dae5',300:'#adb9cb',400:'#8494ac',
                  500:'#647591',600:'#4f5e77',700:'#414d61',800:'#384252',900:'#323a47' },
        ember:  { 50:'#fef2f3',100:'#fde3e5',200:'#fbccd1',300:'#f7a5ae',400:'#f17384',
                  500:'#e6455d',600:'#c8102e',700:'#ab0f2a',800:'#8f1029',900:'#7a1228' },
        brass:  { 50:'#fdf9ed',100:'#faf0cd',200:'#f4de9d',300:'#edc663',400:'#e7ad38',
                  500:'#d9911c',600:'#c07314',700:'#9e5414',800:'#814317',900:'#6c3816' },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans Arabic"','"Noto Kufi Arabic"','system-ui','-apple-system','Segoe UI','sans-serif'],
        display: ['"Cairo"','"IBM Plex Sans Arabic"','system-ui','sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(10,28,56,.04), 0 8px 24px -12px rgba(10,28,56,.18)',
        lift: '0 2px 4px rgba(10,28,56,.05), 0 18px 40px -18px rgba(10,28,56,.28)',
      },
      borderRadius: { xl: '0.875rem', '2xl': '1.125rem', '3xl': '1.5rem' },
      keyframes: {
        'fade-up': { '0%': { opacity:'0', transform:'translateY(10px)' }, '100%': { opacity:'1', transform:'none' } },
        shimmer: { '100%': { transform: 'translateX(-100%)' } },
      },
      animation: { 'fade-up': 'fade-up .45s cubic-bezier(.22,1,.36,1) both' },
    },
  },
  plugins: [],
};
