<!DOCTYPE html>

<html class="light" lang="es"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Contact - MoonBeauty</title>
<!-- Fonts -->
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&amp;family=Be+Vietnam+Pro:wght@100;300;400;600&amp;display=swap" rel="stylesheet"/>
<!-- Material Symbols -->
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<!-- Tailwind CSS -->
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            "colors": {
                    "on-surface-variant": "#42484b",
                    "on-secondary-container": "#5b6468",
                    "on-secondary-fixed-variant": "#3f484b",
                    "mist-grey": "#EDF2F7",
                    "on-error-container": "#93000a",
                    "porcelain-white": "#FFFFFF",
                    "tertiary-fixed": "#e1e3e4",
                    "surface-bright": "#f9f9ff",
                    "secondary-fixed": "#dbe4e8",
                    "outline": "#72787b",
                    "inverse-on-surface": "#ebf1ff",
                    "inverse-surface": "#263142",
                    "on-surface": "#111c2c",
                    "error-container": "#ffdad6",
                    "secondary-fixed-dim": "#bfc8cc",
                    "surface-container-highest": "#d8e3fa",
                    "on-tertiary-fixed": "#191c1d",
                    "error": "#ba1a1a",
                    "primary-container": "#b8d8e6",
                    "on-secondary": "#ffffff",
                    "tertiary-fixed-dim": "#c5c7c8",
                    "on-tertiary-container": "#585b5c",
                    "surface": "#f9f9ff",
                    "surface-tint": "#44636f",
                    "outline-variant": "#c1c7cb",
                    "surface-dim": "#cfdaf1",
                    "tertiary-container": "#d2d3d4",
                    "on-background": "#111c2c",
                    "on-primary-fixed": "#001f28",
                    "primary": "#44636f",
                    "surface-container-high": "#dee8ff",
                    "on-tertiary": "#ffffff",
                    "on-primary-container": "#415f6b",
                    "cool-slate": "#718096",
                    "secondary": "#576063",
                    "surface-container-low": "#f0f3ff",
                    "on-error": "#ffffff",
                    "on-primary": "#ffffff",
                    "on-primary-fixed-variant": "#2c4b56",
                    "secondary-container": "#d8e1e5",
                    "primary-fixed-dim": "#accbd9",
                    "inverse-primary": "#accbd9",
                    "primary-fixed": "#c7e8f6",
                    "background": "#f9f9ff",
                    "on-secondary-fixed": "#141d20",
                    "surface-variant": "#d8e3fa",
                    "tertiary": "#5c5f60",
                    "ice-blue": "#D1E9F6",
                    "surface-container": "#e7eeff",
                    "on-tertiary-fixed-variant": "#454748",
                    "surface-container-lowest": "#ffffff"
            },
            "borderRadius": {
                    "DEFAULT": "0.25rem",
                    "lg": "0.5rem",
                    "xl": "0.75rem",
                    "full": "9999px"
            },
            "spacing": {
                    "margin-mobile": "16px",
                    "gutter": "24px",
                    "margin-desktop": "64px",
                    "unit": "8px",
                    "container-max": "1200px"
            },
            "fontFamily": {
                    "headline-sm": ["Playfair Display"],
                    "label-caps": ["Be Vietnam Pro"],
                    "display-lg": ["Playfair Display"],
                    "body-md": ["Be Vietnam Pro"],
                    "headline-md": ["Playfair Display"],
                    "body-lg": ["Be Vietnam Pro"],
                    "display-lg-mobile": ["Playfair Display"]
            },
            "fontSize": {
                    "headline-sm": ["24px", { "lineHeight": "1.4", "fontWeight": "400" }],
                    "label-caps": ["12px", { "lineHeight": "1.5", "letterSpacing": "0.1em", "fontWeight": "600" }],
                    "display-lg": ["48px", { "lineHeight": "1.1", "letterSpacing": "-0.02em", "fontWeight": "500" }],
                    "body-md": ["16px", { "lineHeight": "1.6", "fontWeight": "400" }],
                    "headline-md": ["32px", { "lineHeight": "1.3", "fontWeight": "400" }],
                    "body-lg": ["18px", { "lineHeight": "1.6", "fontWeight": "300" }],
                    "display-lg-mobile": ["36px", { "lineHeight": "1.2", "fontWeight": "500" }]
            }
          },
        },
      }
    </script>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24;
        }
        .glass-card {
            background: rgba(255, 255, 255, 0.4);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.3);
        }
        .hover-lift {
            transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .hover-lift:hover {
            transform: translateY(-4px);
        }
        .bg-soft-gradient {
            background: linear-gradient(135deg, #f9f9ff 0%, #D1E9F6 100%);
        }
        ::selection {
            background-color: #b8d8e6;
            color: #415f6b;
        }
    </style>
</head>
<body class="bg-background text-on-surface selection:bg-primary-container selection:text-on-primary-container font-body-md">
<!-- Top Navigation Bar -->
<header class="fixed top-0 w-full z-50 bg-porcelain-white/40 backdrop-blur-md shadow-sm dark:shadow-none">
<nav class="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-4 max-w-container-max mx-auto">
<div class="font-display-lg text-[28px] md:text-display-lg text-primary tracking-tighter dark:text-primary-fixed">
                MoonBeauty
            </div>
<div class="hidden md:flex items-center gap-12">
<a class="font-label-caps text-label-caps text-on-secondary-container hover:text-primary transition-colors duration-300" href="/">Inicio</a>
<a class="font-label-caps text-label-caps text-on-secondary-container hover:text-primary transition-colors duration-300" href="products">Productos</a>
<a class="font-label-caps text-label-caps text-primary border-b border-primary pb-1 transition-colors duration-300" href="contacts">Contacto</a>
</div>
<div class="flex items-center gap-6">
<button class="transition-opacity duration-200 active:opacity-70 text-primary">
<span class="material-symbols-outlined" data-icon="search">search</span>
</button>
<button class="transition-opacity duration-200 active:opacity-70 text-primary relative">
<span class="material-symbols-outlined" data-icon="shopping_bag">shopping_bag</span>
<span class="absolute -top-1 -right-1 bg-primary text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">0</span>
</button>
<button class="md:hidden text-primary">
<span class="material-symbols-outlined" data-icon="menu">menu</span>
</button>
</div>
</nav>
</header>
<main class="pt-32 pb-24 min-h-screen relative overflow-hidden">
<!-- Atmospheric Background Elements -->
<div class="absolute top-0 right-0 w-150 h-150 bg-primary-container/20 rounded-full blur-[120px] -z-10 translate-x-1/2 -translate-y-1/4"></div>
<div class="absolute bottom-0 left-0 w-100 h-100 bg-ice-blue/30 rounded-full blur-[100px] -z-10 -translate-x-1/4 translate-y-1/4"></div>
<section class="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
<div class="grid lg:grid-cols-2 gap-20 items-start">
<!-- Left Column: Content -->
<div class="space-y-12">
<div class="space-y-4">
<span class="font-label-caps text-label-caps text-primary tracking-widest block uppercase">Get in Touch</span>
<h1 class="font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface leading-tight">
                            Let's bring <br/> <span class="italic font-normal">luminous serenity</span> <br/> to your routine.
                        </h1>
<p class="font-body-lg text-body-lg text-on-surface-variant max-w-md">
                            Whether you have a question about our rituals or just want to say hello, we're here to help you shine.
                        </p>
</div>
<div class="grid sm:grid-cols-2 gap-8">
<!-- Contact Detail 1 -->
<a class="group block p-8 glass-card rounded-xl hover-lift transition-all duration-300" href="https://wa.me/04125050043">
<div class="w-12 h-12 bg-primary-container/50 rounded-full flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
<span class="material-symbols-outlined" data-icon="chat">chat</span>
</div>
<h3 class="font-label-caps text-label-caps text-on-surface-variant mb-2">WhatsApp</h3>
<p class="font-headline-sm text-headline-sm text-on-surface group-hover:text-primary transition-colors">0412 5050043</p>
</a>
<!-- Contact Detail 2 -->
<a class="group block p-8 glass-card rounded-xl hover-lift transition-all duration-300" href="https://instagram.com/moonbeauty.val" target="_blank">
<div class="w-12 h-12 bg-primary-container/50 rounded-full flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
<span class="material-symbols-outlined" data-icon="camera">camera</span>
</div>
<h3 class="font-label-caps text-label-caps text-on-surface-variant mb-2">Instagram</h3>
<p class="font-headline-sm text-headline-sm text-on-surface group-hover:text-primary transition-colors">@moonbeauty.val</p>
</a>
</div>
<!-- Visual Accent Image -->
<div class="hidden lg:block relative h-64 w-full rounded-2xl overflow-hidden shadow-sm group">
<!-- svelte-ignore a11y_missing_attribute -->
<img class="w-full h-full object-cover grayscale-20 group-hover:scale-105 transition-transform duration-700" data-alt="A serene, high-end close-up shot of translucent skincare serum droplets on a frosted glass surface. The lighting is ethereal and soft, reflecting light-blue and white tones characteristic of a minimalist K-beauty brand aesthetic. The atmosphere is calm, clinical yet luxurious, with expansive negative space." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDnZFuzncQKncGJLsjflRDmZjdRfLqfyyVwmuz4GUIlC4CmnqMK6hanJfuhwecGuerUjQ8F4a8Y1LS-RUjskqByb4qZFudchI9_F1MXOXAL9yZMPdRh_zu2tuusK5oI0BmrKIc4WS0R8m_dqWL-2TnbcFUWsHXG_RGwMmt1dCWp8yukDurfOYEZEVU64mOPVyeB9G-NvrKvcvf9mFENcya0nceJ2OgxVgBkp7MMofmD2S3Ffitp2PSsCwkqOIv_lCZs3KhGHai4SSf7"/>
<div class="absolute inset-0 bg-primary/10 mix-blend-overlay"></div>
</div>
</div>
<!-- Right Column: Form -->
<div class="lg:sticky lg:top-32">
<div class="glass-card p-8 md:p-12 rounded-2xl shadow-sm border border-outline-variant/30 relative">
<!-- Form Header -->
<div class="mb-10 text-center">
<h2 class="font-headline-md text-headline-md text-on-surface mb-2">Send a Message</h2>
<p class="text-cool-slate font-body-md">We usually respond within 24 hours.</p>
</div>
<form class="space-y-md relative z-10" onsubmit={(event) => { event.preventDefault(); alert('Message sent with serenity.'); }}>
<div class="grid md:grid-cols-2 gap-6">
<div class="space-y-2">
<!-- svelte-ignore a11y_label_has_associated_control -->
<label class="font-label-caps text-[10px] text-primary uppercase ml-1">Name</label>
<input class="w-full bg-porcelain-white/50 border-b border-outline-variant focus:border-primary focus:ring-0 transition-all py-3 px-4 outline-none font-body-md rounded-t-lg" placeholder="Your Name" type="text"/>
</div>
<div class="space-y-2">
<!-- svelte-ignore a11y_label_has_associated_control -->
<label class="font-label-caps text-[10px] text-primary uppercase ml-1">Email</label>
<input class="w-full bg-porcelain-white/50 border-b border-outline-variant focus:border-primary focus:ring-0 transition-all py-3 px-4 outline-none font-body-md rounded-t-lg" placeholder="your@email.com" type="email"/>
</div>
</div>
<div class="space-y-2">
<!-- svelte-ignore a11y_label_has_associated_control -->
<label class="font-label-caps text-[10px] text-primary uppercase ml-1">Subject</label>
<select class="w-full bg-porcelain-white/50 border-b border-outline-variant focus:border-primary focus:ring-0 transition-all py-3 px-4 outline-none font-body-md rounded-t-lg appearance-none">
<option>Product Inquiry</option>
<option>Order Status</option>
<option>Collaboration</option>
<option>Other</option>
</select>
</div>
<div class="space-y-2">
<!-- svelte-ignore a11y_label_has_associated_control -->
<label class="
font-label-caps text-[10px] text-primary uppercase ml-1">Message</label>
<textarea class="w-full bg-porcelain-white/50 border-b border-outline-variant focus:border-primary focus:ring-0 transition-all py-3 px-4 outline-none font-body-md rounded-t-lg resize-none" placeholder="How can we assist your skin journey?" rows="4"></textarea>
</div>
<button class="w-full py-5 bg-primary text-white font-label-caps text-label-caps rounded-full shadow-lg hover:bg-on-primary-container transition-all duration-300 transform active:scale-95 flex justify-center items-center gap-3" type="submit">
                                Send Ritual Inquiry
                                <span class="material-symbols-outlined text-[18px]" data-icon="send">send</span>
</button>
</form>
</div>
<!-- Social Footer Area (Mobile optimized) -->
<div class="mt-8 flex justify-center gap-6 md:hidden">
<a class="text-cool-slate hover:text-primary transition-colors" href="#"><span class="material-symbols-outlined">public</span></a>
<a class="text-cool-slate hover:text-primary transition-colors" href="#"><span class="material-symbols-outlined">alternate_email</span></a>
</div>
</div>
</div>
</section>
</main>
<!-- Footer -->
<footer class="w-full py-16 px-margin-mobile md:px-margin-desktop bg-mist-grey dark:bg-surface-dim border-t border-mist-grey dark:border-outline-variant flex flex-col items-center justify-center gap-gutter text-center">
<div class="font-headline-sm text-headline-sm text-primary dark:text-primary-fixed">MoonBeauty</div>
<div class="flex gap-8">
<a class="font-label-caps text-label-caps text-cool-slate hover:text-primary transition-colors duration-200" href="https://instagram.com/moonbeauty.val">Instagram</a>
<a class="font-label-caps text-label-caps text-cool-slate hover:text-primary transition-colors duration-200" href="#">Facebook</a>
<a class="font-label-caps text-label-caps text-cool-slate hover:text-primary transition-colors duration-200" href="#">Pinterest</a>
</div>
<p class="font-body-md text-body-md text-on-surface dark:text-inverse-on-surface max-w-sm opacity-80">
            © 2024 MoonBeauty. Luminous Serenity for your skin.
        </p>
</footer>
<script>
        // Micro-interaction for form inputs
        document.querySelectorAll('input, textarea, select').forEach(el => {
            el.addEventListener('focus', () => {
                el.parentElement.querySelector('label').classList.add('text-primary');
            });
            el.addEventListener('blur', () => {
                if(!el.value) el.parentElement.querySelector('label').classList.remove('text-primary');
            });
        });

        // Sticky Navbar Scroll Effect
        window.addEventListener('scroll', () => {
            const header = document.querySelector('header');
            if (window.scrollY > 20) {
                header.classList.add('bg-porcelain-white/80', 'py-3');
                header.classList.remove('bg-porcelain-white/40', 'py-4');
            } else {
                header.classList.add('bg-porcelain-white/40', 'py-4');
                header.classList.remove('bg-porcelain-white/80', 'py-3');
            }
        });
    </script>
</body></html>
