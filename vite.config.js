import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

export default defineConfig({
  plugins: [
    react(),
    cssInjectedByJsPlugin(), 
  ],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    lib: {
      entry: 'src/main.jsx',
      name: 'RewriteAssistantPremium',
      formats: ['iife'],
      fileName: () => 'r-w-a-v2-3_react.js',
    },
    rollupOptions: {
      external: [],      
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,   // 👈 Giữ nguyên theo đúng ý bạn để phục vụ RWA_LOGGER
        drop_debugger: true,  // 👈 Xóa bỏ hoàn toàn các trình debugger dùng lúc code
        dead_code: true,      // 👈 Loại bỏ sạch những đoạn code thừa không bao giờ chạy đến
        unused: true,         // 👈 Xóa bỏ các biến/hàm được khai báo nhưng không dùng
        passes: 2,            // 👈 Ép Terser chạy nén và tối ưu 2 vòng liên tiếp để tối đa hiệu năng giảm dung lượng
      },
      format: {
        comments: false,       // 👈 Xóa sạch 100% các dòng ghi chú (comments) trong file build cuối cùng
      }
    },
  },
  worker: {
    format: 'es',
  }
});