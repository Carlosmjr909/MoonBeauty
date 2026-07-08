<!DOCTYPE html>

<html class="light" lang="es"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>MoonBeauty | Luminous Serenity</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;700&amp;family=Be+Vietnam+Pro:wght@300;400;600&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
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
                    "headline-sm": ["24px", {"lineHeight": "1.4", "fontWeight": "400"}],
                    "label-caps": ["12px", {"lineHeight": "1.5", "letterSpacing": "0.1em", "fontWeight": "600"}],
                    "display-lg": ["48px", {"lineHeight": "1.1", "letterSpacing": "-0.02em", "fontWeight": "500"}],
                    "body-md": ["16px", {"lineHeight": "1.6", "fontWeight": "400"}],
                    "headline-md": ["32px", {"lineHeight": "1.3", "fontWeight": "400"}],
                    "body-lg": ["18px", {"lineHeight": "1.6", "fontWeight": "300"}],
                    "display-lg-mobile": ["36px", {"lineHeight": "1.2", "fontWeight": "500"}]
            }
          },
        },
      }
    </script>
<style>
        body {
            background-color: #f9f9ff;
            color: #111c2c;
            overflow-x: hidden;
        }
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24;
        }
        .glass-nav {
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
        }
        .hover-lift {
            transition: transform 0.4s cubic-bezier(0.2, 0, 0.2, 1), box-shadow 0.4s cubic-bezier(0.2, 0, 0.2, 1);
        }
        .hover-lift:hover {
            transform: translateY(-8px);
            box-shadow: 0 20px 40px -10px rgba(184, 216, 230, 0.3);
        }
        .fade-in-section {
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.8s ease-out;
        }
        .fade-in-section.visible {
            opacity: 1;
            transform: translateY(0);
        }
    </style>
</head>
<body class="font-body-md text-body-md antialiased">
<!-- Top Navigation Bar -->
<header class="fixed top-0 w-full z-50 bg-porcelain-white/40 backdrop-blur-md shadow-sm transition-all duration-300">
<nav class="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-4 max-w-container-max mx-auto">
<!-- Brand Identity -->
<div class="font-display-lg text-display-lg-mobile md:text-display-lg text-primary tracking-tighter cursor-pointer">
                MoonBeauty
            </div>
<!-- Desktop Links -->
<div class="hidden md:flex items-center gap-10">
<a class="font-label-caps text-label-caps text-primary border-b border-primary pb-1 transition-colors duration-300" href="/">Inicio</a>
<a class="font-label-caps text-label-caps text-on-secondary-container hover:text-primary transition-colors duration-300" href="products">Productos</a>
<a class="font-label-caps text-label-caps text-on-secondary-container hover:text-primary transition-colors duration-300" href="contacts">Contacto</a>
</div>
<!-- Actions -->
<div class="flex items-center gap-6">
<button class="flex items-center justify-center transition-opacity duration-200 active:opacity-70">
<span class="material-symbols-outlined text-primary text-2xl">search</span>
</button>
<button class="flex items-center justify-center transition-opacity duration-200 active:opacity-70 relative">
<span class="material-symbols-outlined text-primary text-2xl">shopping_bag</span>
<span class="absolute -top-1 -right-1 bg-primary text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">2</span>
</button>
<!-- Mobile Menu Icon -->
<button class="md:hidden flex items-center justify-center">
<span class="material-symbols-outlined text-primary text-2xl">menu</span>
</button>
</div>
</nav>
</header>
<main class="pt-0">
<!-- Hero Section -->
<section class="relative h-screen flex items-center justify-center overflow-hidden">
<!-- Background Image with Soft Focus and Etheral Glow -->
<div class="absolute inset-0 z-0">
<div class="absolute inset-0 bg-gradient-to-b from-porcelain-white/20 via-transparent to-background/80 z-10"></div>
<div class="w-full h-full scale-110 blur-sm" data-alt="A high-end, cinematic close-up of a premium glass skincare bottle resting on a bed of soft, white petals. The background is a dreamy, out-of-focus mix of luminous blues and pearlescent whites, creating a serene and clinical yet luxurious atmosphere. Soft, natural morning light filters through, highlighting the elegant curves of the glass and the airy, minimalist vibe of K-beauty aesthetics." style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuCxTQVKG-u_7kmW5KikcU7-heNPYpi8kBBZzOvJFmVZYN4qxpY5prEBWTfRAfk3ER2hLg4q_gt0DbN-kJ947vil_ZdT9Sw5iMTh8dQgpiaWcbPSk3V6gqk4kkhO6goAP4HRRfb5UA8TIHF_fYil0r0gkxbch5E6u7G9abNcqHMDfZHaAJB--daUT4hRC-Hwz4FG1n97q0iQgg1-DofRuf-JlNrNmCcdquCc6TobAZM1W55OU__MMipAP_cGzkPl5dbrL8HofgbNd5Ql')">
</div>
</div>
<div class="relative z-20 text-center px-margin-mobile max-w-4xl">
<h1 class="font-display-lg text-display-lg-mobile md:text-display-lg text-primary mb-4 tracking-tighter opacity-0 translate-y-8 animate-[fadeIn_1s_ease-out_forwards]">
                    MoonBeauty
                </h1>
<p class="font-body-lg text-body-lg text-cool-slate mb-10 tracking-wide opacity-0 translate-y-8 animate-[fadeIn_1s_ease-out_0.3s_forwards]">
                    Desde Corea a tu casa
                </p>
<div class="opacity-0 translate-y-8 animate-[fadeIn_1s_ease-out_0.6s_forwards]">
<a class="inline-block px-12 py-4 bg-primary-container text-on-primary-container font-label-caps text-label-caps rounded-full hover:bg-primary hover:text-white transition-all duration-500 shadow-sm hover:shadow-lg" href="#catalog">
                        Ver Catálogo
                    </a>
</div>
</div>
<!-- Floating Decorative Element -->
<div class="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce opacity-40">
<span class="material-symbols-outlined text-primary text-3xl">keyboard_arrow_down</span>
</div>
</section>
<!-- Value Propositions (Bento Inspired Layout) -->
<section class="py-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto overflow-hidden">
<div class="grid grid-cols-1 md:grid-cols-3 gap-gutter">
<div class="md:col-span-2 bg-white rounded-3xl p-10 flex flex-col justify-between hover-lift">
<div>
<span class="material-symbols-outlined text-4xl text-primary-container mb-6" style="font-variation-settings: 'FILL' 1;">auto_awesome</span>
<h2 class="font-headline-md text-headline-md text-primary mb-4">La Ciencia de la Calma</h2>
<p class="font-body-md text-on-secondary-container max-w-md">Seleccionamos cuidadosamente rituales coreanos que combinan la tecnología clínica más avanzada con ingredientes botánicos ancestrales.</p>
</div>
<div class="mt-12 h-48 rounded-2xl overflow-hidden" data-alt="A minimalist laboratory setting showcasing a pristine white ceramic bowl with clear liquid droplets. Beside it, fresh green leaves and a glass pipette represent the fusion of nature and science. The lighting is high-key and bright, with soft shadows and a cool, clinical blue undertone, emphasizing purity and efficacy in skincare." style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuAQZw0mAb2iEDSvMaw8_DDX7Apet3SyffcpAvYPckkl4XJPXO9f6n613PR3TC7VOTNIZsS3KBKMc56PbNV5yEPyO6l4eeSI2Z53IDqIkytaDggX_q2pnKmyxR5wqbfsAZhF_UURvhtlZXZNb8PTPMnHYL83Fl2Tu59jAJwbuaLpxLRyqhW2EDBVqFiPT09UMSOYbfTdzYxCkmytzIQyZhWkdY5RaWSsXe_Aowy-jEhGhe34vlzBgOhr1DZW7EMAlo8XXW5Z7f_Jm-kJ')">
</div>
</div>
<div class="bg-primary-container/20 rounded-3xl p-10 flex flex-col items-center text-center justify-center hover-lift">
<span class="material-symbols-outlined text-5xl text-primary mb-6">workspace_premium</span>
<h3 class="font-headline-sm text-headline-sm text-primary mb-4">Curaduría Exclusiva</h3>
<p class="font-body-md text-on-secondary-container">Solo marcas que cumplen con los estándares más estrictos de K-Beauty y sostenibilidad.</p>
</div>
<div class="bg-mist-grey rounded-3xl p-10 flex flex-col items-center text-center justify-center hover-lift">
<span class="material-symbols-outlined text-5xl text-primary mb-6">local_shipping</span>
<h3 class="font-headline-sm text-headline-sm text-primary mb-4">Envío Directo</h3>
<p class="font-body-md text-on-secondary-container">Logística optimizada para que tu ritual no se detenga. Directo desde Seúl a tu puerta.</p>
</div>
<div class="md:col-span-2 bg-inverse-surface text-porcelain-white rounded-3xl p-10 flex flex-col md:flex-row items-center gap-10 hover-lift">
<div class="flex-1 h-64 w-full rounded-2xl overflow-hidden" data-alt="An artistic shot of moonlight reflecting off a calm, dark ocean surface at night. The water ripples are shimmering with silvery light, creating a deep sense of luminous serenity. This visual represents the brand's name 'MoonBeauty' and its core aesthetic of tranquility and quiet luxury. The palette is deep navy and glowing silver." style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuBRD9-VGWGCOqbnNDDuutkz3kmrlx-w0UAeh24iBEtn1784WmgiLKdtPViN9ZGm_AUu-lt6EaemqqKzv34D2Q0ldx18sn0JTxtHjdxtKmQM-_0k5zkIoDkuE-zIh0aHEGtqfxC-m3KTZAYJ5JgzUlNNPO6VT3q6ro6FZF3jDqnaTe6rrUXCHXGe1CjVI0C6-_6t2oMi_vXz_5FITRsh0lCcRUbFmhqC9oz_POq64_SXwmR9D5pTVQMHRGMb1NHnhh4wr5vOLbyqrQ1A')">
</div>
<div class="flex-1">
<h2 class="font-headline-md text-headline-md mb-4">Luminous Serenity</h2>
<p class="font-body-md opacity-80 mb-6">Descubre el brillo que nace desde adentro con productos diseñados para nutrir no solo tu piel, sino tu bienestar diario.</p>
<a class="text-primary-fixed-dim font-label-caps text-label-caps border-b border-primary-fixed-dim pb-1 hover:text-white transition-colors" href="#">Saber Más</a>
</div>
</div>
</div>
</section>
<!-- Featured Products -->
<section class="py-24 bg-white" id="catalog">
<div class="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
<div class="flex justify-between items-end mb-16">
<div>
<span class="font-label-caps text-label-caps text-cool-slate">LO NUEVO</span>
<h2 class="font-headline-md text-headline-md text-primary mt-2">Favoritos de Temporada</h2>
</div>
<a class="font-label-caps text-label-caps text-primary hover:opacity-70 transition-opacity hidden md:block" href="#">Ver Todos</a>
</div>
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
<!-- Product Card 1 -->
<div class="group cursor-pointer">
<div class="aspect-[3/4] rounded-3xl overflow-hidden mb-6 relative bg-surface-container-low transition-all duration-500 group-hover:shadow-2xl">
<div class="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" data-alt="Product shot of a minimalist white bottle with a silver cap, standing on a translucent ice-blue acrylic block. The lighting is diffused and ethereal, casting soft, layered shadows. The product looks clinical and high-end, typical of luxurious K-beauty brands. A small sprig of white jasmine is visible in the corner." style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuBwTawVM1tg_Ui1r2MqkM3qQ1KAWlqT9OHP4xX-5YxlsTCWtcbtVxEg-B8XUlXngy-L_Gz0k3CuLGn2sxYbHuZp9dlp4vBpiZayJbWs5tCD48RkuozucZNT-7HthNziaJ4-S27T-1SUGTNv3T4ItA-InhyuWd-XsbjPMwB7Na3rvdHIgvvrlr5dSiluv292BO46oEsqtCWDBy829UmkGHIE2fOEXfUQf1kv5bNXsHpGgO6Auta9VdQn6VKA7-3yCPJVs5PMT_iHuVkl')">
</div>
<div class="absolute top-4 left-4">
<span class="bg-ice-blue text-cool-slate font-label-caps text-[10px] px-3 py-1 rounded-full">NEW</span>
</div>
</div>
<h4 class="font-headline-sm text-headline-sm text-primary mb-1">Glow Serum Mist</h4>
<p class="font-body-md text-cool-slate mb-2">Hidratación profunda 24h</p>
<div class="font-label-caps text-label-caps text-primary font-bold">$42.00</div>
</div>
<!-- Product Card 2 -->
<div class="group cursor-pointer">
<div class="aspect-[3/4] rounded-3xl overflow-hidden mb-6 relative bg-surface-container-low transition-all duration-500 group-hover:shadow-2xl">
<div class="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" data-alt="A minimalist cosmetic jar containing a semi-transparent, milky gel cream. The jar is frosted glass with a matte white lid. It is placed on a smooth, white marble surface with soft shadows. The overall image is extremely clean, bright, and airy, evoking a sense of purity and clinical excellence." style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuBfocQjXFRNCYjB7qK2dNhHEA_lOxIwqtibC71_P7SfLj2WkQRWnY3cgV_K1rt3sZ1qhT4_M2rWGSzTWPw-nCJQwz0-nt9OWEwTQEfAF_BpWya73Tn9xpA5uzNkff6WXj7IXAkwStwawCDwLGZHv5ScgWTOSbP4MpDaSm1Cwl_cILg1VTZutdxnubxcY4zYOxNMfROh4E2Wa-ttTVgCyE_dLhMXLjfBrBPw5PCitmqGNO5CehWyLNcNvaJDfEWV8ABoxDFQqdGD1rAJ')">
</div>
</div>
<h4 class="font-headline-sm text-headline-sm text-primary mb-1">Moon Water Cream</h4>
<p class="font-body-md text-cool-slate mb-2">Crema reparadora nocturna</p>
<div class="font-label-caps text-label-caps text-primary font-bold">$55.00</div>
</div>
<!-- Product Card 3 -->
<div class="group cursor-pointer">
<div class="aspect-[3/4] rounded-3xl overflow-hidden mb-6 relative bg-surface-container-low transition-all duration-500 group-hover:shadow-2xl">
<div class="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" data-alt="A luxury dropper bottle with a clear liquid serum inside. Tiny oxygen bubbles are suspended in the liquid. The bottle sits next to a small, polished light-blue crystal on a white textured surface. The image aesthetic is very 'Luminous Serenity,' focusing on transparency, light, and clinical beauty." style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuAMbMePgQg7Bu1v9A1DyKYt5XgvS4f9ANFNPlKdNav-K7D-1Oo9QrCevSFhz8u4EjykUnOV2rpLYSXHCM89XS7k_tmWCwZuc0pXygD7IAUBE4w7wbJ2dyTw4mkrEkZx9lQ_BYka-uxIB7HeghMaZCPRENm0Q-I7Bt_-tt3dU_NpAAoz2T9CSRUadKd0J-iZjlgwH4MlpYbrt1DXdGd98qmbVQMynhDHS3d4ibme3pmL2Q0G-Gem_0WIme6Xl6olNIZ6thHOqaKUSHJE')">
</div>
<div class="absolute top-4 left-4">
<span class="bg-primary-container text-on-primary-container font-label-caps text-[10px] px-3 py-1 rounded-full">BEST SELLER</span>
</div>
</div>
<h4 class="font-headline-sm text-headline-sm text-primary mb-1">Vital Essence</h4>
<p class="font-body-md text-cool-slate mb-2">Tratamiento iluminador</p>
<div class="font-label-caps text-label-caps text-primary font-bold">$68.00</div>
</div>
</div>
<div class="mt-16 text-center md:hidden">
<a class="inline-block px-8 py-3 border border-outline text-primary font-label-caps text-label-caps rounded-full" href="#">Ver Catálogo Completo</a>
</div>
</div>
</section>
<!-- Atmospheric Quote/Break -->
<section class="py-32 bg-surface-dim/20 flex items-center justify-center text-center">
<div class="px-margin-mobile max-w-2xl">
<span class="material-symbols-outlined text-primary/30 text-5xl mb-8">format_quote</span>
<p class="font-headline-md text-headline-md text-primary italic leading-relaxed">
                    "La verdadera belleza no se trata de perfección, sino de la luz que emanas cuando te sientes en paz con tu ritual."
                </p>
<div class="mt-8 font-label-caps text-label-caps text-cool-slate">Filosofía MoonBeauty</div>
</div>
</section>
</main>
<!-- Footer -->
<footer class="bg-mist-grey w-full py-16 px-margin-mobile md:px-margin-desktop border-t border-mist-grey">
<div class="max-w-container-max mx-auto flex flex-col items-center justify-center gap-gutter text-center w-full">
<div class="font-headline-sm text-headline-sm text-primary">MoonBeauty</div>
<div class="flex flex-wrap justify-center gap-8 my-4">
<a class="font-label-caps text-label-caps text-cool-slate hover:text-primary transition-colors duration-200" href="#">Instagram</a>
<a class="font-label-caps text-label-caps text-cool-slate hover:text-primary transition-colors duration-200" href="#">Facebook</a>
<a class="font-label-caps text-label-caps text-cool-slate hover:text-primary transition-colors duration-200" href="#">Pinterest</a>
</div>
<div class="font-body-md text-body-md text-on-surface opacity-80 max-w-md">
                Suscríbete para recibir consejos de K-Beauty y ofertas exclusivas.
                <form class="mt-6 flex flex-col sm:flex-row gap-2">
<input class="bg-white/50 border-none rounded-full px-6 py-2 focus:ring-1 focus:ring-primary-container text-body-md w-full sm:w-64" placeholder="Tu correo electrónico" type="email"/>
<button class="bg-primary text-white font-label-caps text-label-caps px-6 py-2 rounded-full hover:opacity-90 transition-opacity" type="submit">Unirse</button>
</form>
</div>
<div class="mt-8 pt-8 border-t border-outline-variant w-full font-body-md text-[14px] text-cool-slate">
                © 2024 MoonBeauty. Luminous Serenity for your skin.
            </div>
</div>
</footer>
<script>
        // Simple intersection observer for fade-in animations
        const observerOptions = {
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, observerOptions);

        document.querySelectorAll('section').forEach(section => {
            section.classList.add('fade-in-section');
            observer.observe(section);
        });

        // Navigation scroll effect
        window.addEventListener('scroll', () => {
            const header = document.querySelector('header');
            if (window.scrollY > 50) {
                header.classList.add('bg-porcelain-white/90');
                header.classList.remove('bg-porcelain-white/40');
                header.classList.add('py-2');
                header.classList.remove('py-4');
            } else {
                header.classList.add('bg-porcelain-white/40');
                header.classList.remove('bg-porcelain-white/90');
                header.classList.add('py-4');
                header.classList.remove('py-2');
            }
        });

        // Custom animations
        const style = document.createElement('style');
        style.innerHTML = `
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
        `;
        document.head.appendChild(style);
    </script>
</body></html>