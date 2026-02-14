/// <reference types="vite/client" />

declare namespace React {
    interface ImgHTMLAttributes<T> extends HTMLAttributes<T> {
        fetchpriority?: 'high' | 'low' | 'auto';
    }
}
