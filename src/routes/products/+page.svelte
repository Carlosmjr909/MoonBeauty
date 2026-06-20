<!DOCTYPE html>

<html class="light" lang="es"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>MoonBeauty | Catálogo de Productos</title>
<!-- Fonts -->
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;700&amp;family=Be+Vietnam+Pro:wght@300;400;600&amp;display=swap" rel="stylesheet"/>
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
        .product-card-shadow {
            transition: box-shadow 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .product-card-shadow:hover {
            box-shadow: 0 20px 40px -15px rgba(184, 216, 230, 0.4);
        }
        .glass-nav {
            backdrop-filter: blur(10px);
        }
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24;
        }
    </style>
</head>
<body class="bg-background text-on-surface font-body-md selection:bg-primary-container selection:text-on-primary-container">
<!-- TopNavBar -->
<header class="fixed top-0 w-full z-50 bg-porcelain-white/40 backdrop-blur-md shadow-sm">
<nav class="flex justify-between items-center w-full px-margin-desktop py-4 max-w-container-max mx-auto">
<div class="flex items-center gap-12">
<a class="font-display-lg text-display-lg text-primary tracking-tighter" href="#">MoonBeauty</a>
<div class="hidden md:flex gap-8">
<a class="font-label-caps text-label-caps text-on-secondary-container hover:text-primary transition-colors duration-300" href="#">Inicio</a>
<a class="font-label-caps text-label-caps text-primary border-b border-primary pb-1 transition-colors duration-300" href="#">Productos</a>
<a class="font-label-caps text-label-caps text-on-secondary-container hover:text-primary transition-colors duration-300" href="#">Contacto</a>
</div>
</div>
<div class="flex items-center gap-6">
<button class="transition-opacity duration-200 active:opacity-70 text-primary">
<span class="material-symbols-outlined">search</span>
</button>
<button class="transition-opacity duration-200 active:opacity-70 text-primary relative">
<span class="material-symbols-outlined">shopping_bag</span>
<span class="absolute -top-1 -right-1 bg-primary text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">2</span>
</button>
</div>
</nav>
</header>
<main class="pt-32 pb-24">
<!-- Hero Title Section -->
<section class="max-w-container-max mx-auto px-margin-desktop mb-16 text-center">
<h1 class="font-display-lg text-display-lg text-primary mb-4">Nuestra Colección</h1>
<p class="font-body-lg text-body-lg text-cool-slate max-w-2xl mx-auto">Rituales de belleza inspirados en la serenidad luminosa. Descubre fórmulas clínicas envueltas en texturas etéreas.</p>
</section>
<!-- Filters/Categories -->
<section class="max-w-container-max mx-auto px-margin-desktop mb-12">
<div class="flex justify-center gap-4 md:gap-8 flex-wrap">
<button class="px-6 py-2 rounded-full bg-primary text-white font-label-caps text-label-caps transition-all">Todos</button>
<button class="px-6 py-2 rounded-full border border-mist-grey text-cool-slate font-label-caps text-label-caps hover:bg-ice-blue hover:border-ice-blue transition-all">Rostro</button>
<button class="px-6 py-2 rounded-full border border-mist-grey text-cool-slate font-label-caps text-label-caps hover:bg-ice-blue hover:border-ice-blue transition-all">Labios</button>
<button class="px-6 py-2 rounded-full border border-mist-grey text-cool-slate font-label-caps text-label-caps hover:bg-ice-blue hover:border-ice-blue transition-all">Ojos</button>
</div>
</section>
<!-- Product Grid -->
<section class="max-w-container-max mx-auto px-margin-desktop">
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-gutter gap-y-12">
<!-- Product 1 -->
<div class="group cursor-pointer">
<div class="aspect-[4/5] bg-surface-container-low overflow-hidden rounded-lg mb-4 product-card-shadow relative">
<div class="absolute top-4 left-4 z-10">
<span class="px-3 py-1 bg-ice-blue text-on-secondary-container font-label-caps text-[10px] rounded-full">NUEVO</span>
</div>
<img class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" data-alt="A minimalist and high-end skincare bottle on a pristine white marble surface. The lighting is soft and ethereal, emphasizing the clean glass texture and subtle blue gradients of the packaging. The scene is bright and airy, reflecting a luxury K-Beauty aesthetic with clinical precision and elegant simplicity." src="https://lh3.googleusercontent.com/aida-public/AB6AXuA6p_rDZvab1h-iCHc2zeWJ9UX_N4ZQyVCTBZ-UDrNgw4x-l1WoALcmpbSLpXLvyfOP7bLbW1ofdGCdIY8IlVbvfxvrm7LdvX3tfOhDdfXK38zjw4yUCd2D8EKIN8FbxQNqePuHVpJjOmckYmUs0wIkhJ55Yj9Or4J3OD6n6pcX7TQXLnBbqG1P-b5bxYAd2lqKE5Fa25a8DVwdUyT1YqvLc1q7uU46J8ya5wy3mhna9nStyXipdpgd9EOaQTQVu5Dqbq4XN4UsA3r-"/>
<div class="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
</div>
<div class="space-y-1">
<p class="font-label-caps text-[11px] text-cool-slate uppercase tracking-widest">Rostro</p>
<h3 class="font-headline-sm text-headline-sm text-primary group-hover:text-primary-fixed-dim transition-colors">Lunar Mist Serum</h3>
<p class="font-body-md text-body-md text-on-surface-variant">$85.00</p>
</div>
</div>
<!-- Product 2 -->
<div class="group cursor-pointer">
<div class="aspect-[4/5] bg-surface-container-low overflow-hidden rounded-lg mb-4 product-card-shadow relative">
<img class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" data-alt="Close-up of a premium lipstick case with a soft-touch matte finish in a light slate blue. The product is placed against a soft, unfocused background of silk fabric. High-key lighting creates a serene and sophisticated atmosphere, highlighting the elegant curves and minimalist branding of MoonBeauty." src="https://lh3.googleusercontent.com/aida-public/AB6AXuB2NFpcIVF_m0Kfg9MisUe4rEKWKKJ33FjcQRRBnBXhQiKBryTT9ZI3ewyfbSVMDaWZd_9bXeWKg98NeDWxkpvbNjQ6nz2eB3lYj7zbG6fz5OyyGirdzy32J-oIbLOxqwlRTUIqROjtjo1qKuaR3H8hWO5dhqKQOSqZXZyD2T8Gfgqj0utDFiuBJrZBAUUikYDo_i99a5XJGS8GzRYUsrMJdvCdQtf3TJp5et0xrubFQlDvcA3N9_tHsRzkuEddj2qmd7rEpxEuHGIq"/>
<div class="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
</div>
<div class="space-y-1">
<p class="font-label-caps text-[11px] text-cool-slate uppercase tracking-widest">Labios</p>
<h3 class="font-headline-sm text-headline-sm text-primary">Velvet Dusk Balm</h3>
<p class="font-body-md text-body-md text-on-surface-variant">$32.00</p>
</div>
</div>
<!-- Product 3 -->
<div class="group cursor-pointer">
<div class="aspect-[4/5] bg-surface-container-low overflow-hidden rounded-lg mb-4 product-card-shadow relative">
<div class="absolute top-4 left-4 z-10">
<span class="px-3 py-1 bg-surface-container-highest text-primary font-label-caps text-[10px] rounded-full">BEST SELLER</span>
</div>
<img class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" data-alt="An eyeshadow palette in a minimalist, frosted glass container. The colors inside are neutral earth tones and soft blues. The composition is artistic and clean, lit by natural, diffused morning light creating soft ambient shadows. The overall feel is one of luminous serenity and high-end professional quality." src="https://lh3.googleusercontent.com/aida-public/AB6AXuD04DOVLFKWGlF_EGn81ODZZ8P_JQbcCxhNe58EaJwuVTJckhZWg4BxiIJyMNpwhNMKr-4wBFbCz5c1BKCHTs8iI9bp1H9WzIWt0sZrqJAaKJEum7cCTtlrInYmlW2tNlfFrjZBWApU8oIAcS6kmyMFmbJTwO6wykdtrRMVdfsIzom5SNlxDOvBQdowJprLSmAqcWSIlv1VR7hjyeGdicYwbf3FTWYA9RzPlTzhiBT5u7fGWRSCD2_IsBREcqMOQRyDiD-Nxh3O0s-b"/>
<div class="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
</div>
<div class="space-y-1">
<p class="font-label-caps text-[11px] text-cool-slate uppercase tracking-widest">Ojos</p>
<h3 class="font-headline-sm text-headline-sm text-primary">Aether Eye Palette</h3>
<p class="font-body-md text-body-md text-on-surface-variant">$64.00</p>
</div>
</div>
<!-- Product 4 -->
<div class="group cursor-pointer">
<div class="aspect-[4/5] bg-surface-container-low overflow-hidden rounded-lg mb-4 product-card-shadow relative">
<img class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" data-alt="A luxury facial oil bottle made of iridescent glass reflecting soft pastel tones. The bottle sits on a clean, reflective white surface with tiny water droplets around it. The lighting is bright and crisp, showcasing the purity and clinical efficacy of the MoonBeauty product line in a minimalist setting." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCw6Do7xQ7Bo8QpjUNjZVGDCnVGCSZcizBYRoxtkYPyjg5JN_wlK6PmY9dJlwD1HeO3DKMAIQ69FBeaibt1E6zuVlk50LG8AB02xJe1TyE_OOMLgS6P0XQsx3uAcvKLkNqMeUFGRgG72KQmWgSbRsDNTB3_aapooXv6GTKUwwgibkFBZMx2ZEiZziAWcLdm8Tw481MOsakSg_zQPusa3thmkB9lOlnwunWC-v28sc1LIXm3oas9hWT1rAl2tpYK9fd96UZAANp22aZT"/>
<div class="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
</div>
<div class="space-y-1">
<p class="font-label-caps text-[11px] text-cool-slate uppercase tracking-widest">Rostro</p>
<h3 class="font-headline-sm text-headline-sm text-primary">Stellar Glow Oil</h3>
<p class="font-body-md text-body-md text-on-surface-variant">$92.00</p>
</div>
</div>
<!-- Product 5 -->
<div class="group cursor-pointer">
<div class="aspect-[4/5] bg-surface-container-low overflow-hidden rounded-lg mb-4 product-card-shadow relative">
<img class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" data-alt="A sophisticated mascara wand and tube with a silver-blue metallic finish. The background is a gradient of soft greys and whites. The lighting emphasizes the sleek design and high-end material quality. The composition is asymmetrical and modern, consistent with a premium skincare and makeup brand's visual identity." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDx4LQ71OCdP2fdSaxgCo4zGkPeU538gkbdliglDVnudcaRaVCYqFrDWw3ZUjEE5GPekSB-jCC4qGQ6NybeHrmUIxR3CNO_io6-WYRPP4naH4tDtZNVsj54wwt4fGyhEnTYReH_N6pEhfDD79hSgvL0Ou5Mnk4IIBlDITy-BtLfb7qGwJdWZGnVj0pKt4VCXLgdgTPQpXoPYm3SuLG_kW-qFdw6ABnW-3beUK1Mc3Af94OZIISIOomq7WV4mppaXSSUi40RU5XlfrqL"/>
<div class="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
</div>
<div class="space-y-1">
<p class="font-label-caps text-[11px] text-cool-slate uppercase tracking-widest">Ojos</p>
<h3 class="font-headline-sm text-headline-sm text-primary">Void Lash Mascara</h3>
<p class="font-body-md text-body-md text-on-surface-variant">$28.00</p>
</div>
</div>
<!-- Product 6 -->
<div class="group cursor-pointer">
<div class="aspect-[4/5] bg-surface-container-low overflow-hidden rounded-lg mb-4 product-card-shadow relative">
<img class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" data-alt="A minimalist jar of face cream with a thick, luxurious white texture visible. The jar is made of heavy porcelain-white glass with a brushed silver lid. The lighting is high-key and bright, creating a sense of cleanliness and clinical authority. The background is simple and uncluttered, focusing entirely on the product's elegant form." src="https://lh3.googleusercontent.com/aida-public/AB6AXuB3S0eCVAnS1px7HfqfJSveMpdUsqDPibNG-xa9uFkkbNMYul341AS5NUt26hhCbIA8VEQkexaBmCJtV1wNPi1S1HnUijvde9a__wemtbfxMakrkeyiijFXU-ogOv4KqVhn-ErqbONV6Ak2SpZQNHwb11cbPfNlgsNs9-vyHuQyBQXACTQD5Lb9ectEN2Zc7MyEPBhSM1vQ8SH9Eeb9f6or3Wunlk5q997IfwD8a1eKy_HDA2JHOkAyJr4uX8w1StWoWWyaXUpMl2Ai"/>
<div class="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
</div>
<div class="space-y-1">
<p class="font-label-caps text-[11px] text-cool-slate uppercase tracking-widest">Rostro</p>
<h3 class="font-headline-sm text-headline-sm text-primary">Cloud Cream</h3>
<p class="font-body-md text-body-md text-on-surface-variant">$55.00</p>
</div>
</div>
<!-- Product 7 -->
<div class="group cursor-pointer">
<div class="aspect-[4/5] bg-surface-container-low overflow-hidden rounded-lg mb-4 product-card-shadow relative">
<img class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" data-alt="A liquid lipstick applicator showing a soft rose-colored pigment. The container is transparent glass with a minimalist logo. The lighting is soft and focused, highlighting the rich color and smooth texture. The scene is set in a bright, ethereal environment that evokes a feeling of quiet luxury and morning serenity." src="https://lh3.googleusercontent.com/aida-public/AB6AXuA11OVlRwGqDmpU4_u1uvX4kFPwyt1aSC_p0jKn3R5nZliPB14uCzlkZZLkmQeE7A-zYzThqsrjXfTplDo40wMDAtuaIVwHdnfBmcoasBIwHehSxAzUkEMEvfO7Z7eZmnkwaIRH07G0Z4ei0CRjAzq4ZL2Ewpugc-bG5rhvzrEM89woJ9KiFoMMG3RNn2o5Ak0ljVU88oTinuZUFjZv6cI-b8-3R4shVHAIWWmL1m3blU9hLgl-D1oQFRCzbCT5RhIVvHFlbMAfZsyY"/>
<div class="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
</div>
<div class="space-y-1">
<p class="font-label-caps text-[11px] text-cool-slate uppercase tracking-widest">Labios</p>
<h3 class="font-headline-sm text-headline-sm text-primary">Petal Stain</h3>
<p class="font-body-md text-body-md text-on-surface-variant">$26.00</p>
</div>
</div>
<!-- Product 8 -->
<div class="group cursor-pointer">
<div class="aspect-[4/5] bg-surface-container-low overflow-hidden rounded-lg mb-4 product-card-shadow relative">
<img class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" data-alt="A set of professional makeup brushes with light wood handles and soft, white bristles. They are arranged neatly on a light-colored stone tray. The lighting is soft and ambient, casting delicate blue-tinted shadows. The overall aesthetic is impeccably clean, high-end, and minimalist, emphasizing the ritualistic aspect of beauty." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAeK1dmGL6_lc1wihgcqJDK1svYipyJhW6ovdamtfufxruGT04my2h8_TMfnx8at-VvCvV9gZe8BGiGOwLSmhe3nyoBJlqBFN1YAwuVDhFqv6d4gKwzszEVrkvf5JjcX8kVVmeyCEy2XprGuoYgqGS6k-JGlKJX8crLP8ZQDwrGQcnsbVpnxanZCuFP8Ed9k7VIzyphQo7z1P6InAVA6cMHjb0jzxp0tAhDaiuMCCA5hX0TdE907H976P1YNhgC4ZgzPt1sfRL0M7-T"/>
<div class="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
</div>
<div class="space-y-1">
<p class="font-label-caps text-[11px] text-cool-slate uppercase tracking-widest">Accesorios</p>
<h3 class="font-headline-sm text-headline-sm text-primary">Serene Brush Kit</h3>
<p class="font-body-md text-body-md text-on-surface-variant">$110.00</p>
</div>
</div>
</div>
</section>
<!-- Newsletter / CTA Section -->
<section class="mt-32 max-w-[800px] mx-auto px-margin-mobile text-center">
<div class="bg-primary-container/20 p-12 rounded-xl backdrop-blur-sm border border-white/50">
<h2 class="font-headline-md text-headline-md text-primary mb-6">Únete al Ritual</h2>
<p class="font-body-md text-body-md text-on-primary-container mb-8">Suscríbete para recibir lanzamientos exclusivos y consejos de belleza holística.</p>
<form class="flex flex-col md:flex-row gap-4 max-w-md mx-auto">
<input class="flex-grow bg-white/80 border-none px-6 py-3 rounded-full focus:ring-2 focus:ring-primary text-on-surface outline-none transition-all placeholder:text-cool-slate/50" placeholder="Tu correo electrónico" type="email"/>
<button class="bg-primary text-white px-8 py-3 rounded-full font-label-caps text-label-caps hover:bg-primary/90 transition-all shadow-md active:scale-95" type="submit">Unirse</button>
</form>
</div>
</section>
</main>
<!-- Footer -->
<footer class="w-full py-16 px-margin-desktop bg-mist-grey">
<div class="flex flex-col items-center justify-center gap-gutter text-center w-full">
<a class="font-headline-sm text-headline-sm text-primary" href="#">MoonBeauty</a>
<div class="flex gap-8 mb-4">
<a class="font-label-caps text-label-caps text-cool-slate hover:text-primary transition-colors duration-200" href="#">Instagram</a>
<a class="font-label-caps text-label-caps text-cool-slate hover:text-primary transition-colors duration-200" href="#">Facebook</a>
<a class="font-label-caps text-label-caps text-cool-slate hover:text-primary transition-colors duration-200" href="#">Pinterest</a>
</div>
<p class="font-body-md text-body-md text-on-surface opacity-80">© 2024 MoonBeauty. Luminous Serenity for your skin.</p>
</div>
</footer>
<!-- Micro-interaction script -->
<script>
        document.querySelectorAll('.group').forEach(card => {
            card.addEventListener('mouseenter', () => {
                // Potential for more complex animations if needed
            });
        });
        
        // Sticky Header Effect
        window.addEventListener('scroll', () => {
            const header = document.querySelector('header');
            if (window.scrollY > 50) {
                header.classList.add('bg-porcelain-white/80');
                header.classList.remove('bg-porcelain-white/40');
            } else {
                header.classList.add('bg-porcelain-white/40');
                header.classList.remove('bg-porcelain-white/80');
            }
        });
    </script>
</body></html>