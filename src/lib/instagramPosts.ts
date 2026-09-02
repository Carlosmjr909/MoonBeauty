export type PublicacionInstagramLocal = {
	tipo: 'imagen' | 'video';
	/**
	 * Para "imagen": una o más rutas (carrusel completo del post, en orden).
	 * Para "video": un solo elemento con la URL del archivo (Firebase Storage).
	 */
	archivos: string[];
	/** Portada para videos, mientras cargan. */
	miniatura?: string;
	/** Link al post real en Instagram (para el ícono de la esquina). */
	permalink: string;
};

/**
 * Publicaciones destacadas para la sección "Nuestro Instagram" del inicio.
 * Sin ningún widget ni marca de Instagram — solo la imagen/video.
 *
 * - Fotos: archivos locales en static/instagram/ (bajados y comprimidos del
 *   post real, con todas las fotos del carrusel si el post tiene varias).
 * - Videos: comprimidos con ffmpeg (de ~10-40MB a menos de 3MB c/u) y
 *   alojados en Firebase Storage bajo la carpeta "instagram/", para no
 *   pesar en el repositorio ni afectar el rendimiento del sitio.
 *
 * Para agregar una nueva publicación: pásame el archivo (o el link del
 * post si es una foto, yo la puedo descargar) y la agrego acá.
 */
export const publicacionesInstagram: PublicacionInstagramLocal[] = [
	{
		tipo: 'imagen',
		archivos: [
			'/instagram/Db4MIYXiYGy-1.webp',
			'/instagram/Db4MIYXiYGy-2.webp',
			'/instagram/Db4MIYXiYGy-3.webp',
			'/instagram/Db4MIYXiYGy-4.webp',
			'/instagram/Db4MIYXiYGy-5.webp'
		],
		permalink: 'https://www.instagram.com/p/Db4MIYXiYGy/'
	},
	{
		tipo: 'imagen',
		archivos: [
			'/instagram/DbmJPeAiXtU-1.webp',
			'/instagram/DbmJPeAiXtU-2.webp',
			'/instagram/DbmJPeAiXtU-3.webp',
			'/instagram/DbmJPeAiXtU-4.webp',
			'/instagram/DbmJPeAiXtU-5.webp'
		],
		permalink: 'https://www.instagram.com/p/DbmJPeAiXtU/'
	},
	{
		tipo: 'imagen',
		archivos: [
			'/instagram/DbHN6eBCWCM-1.webp',
			'/instagram/DbHN6eBCWCM-2.webp',
			'/instagram/DbHN6eBCWCM-3.webp',
			'/instagram/DbHN6eBCWCM-4.webp'
		],
		permalink: 'https://www.instagram.com/p/DbHN6eBCWCM/'
	},
	{
		tipo: 'video',
		archivos: [
			'https://firebasestorage.googleapis.com/v0/b/moonbeauty-9ba8f.firebasestorage.app/o/instagram%2Freel-Dbt4EPXJwab.mp4?alt=media&token=d5fd0bef-4cef-4dc1-a6f2-5612d1e00d19'
		],
		miniatura:
			'https://firebasestorage.googleapis.com/v0/b/moonbeauty-9ba8f.firebasestorage.app/o/instagram%2Freel-Dbt4EPXJwab-poster.jpg?alt=media&token=29634884-757a-4ad6-a052-bba6d9634f6a',
		permalink: 'https://www.instagram.com/reel/Dbt4EPXJwab/'
	},
	{
		tipo: 'video',
		archivos: [
			'https://firebasestorage.googleapis.com/v0/b/moonbeauty-9ba8f.firebasestorage.app/o/instagram%2Freel-DbebowUp1VB.mp4?alt=media&token=ee342823-5f9f-4a08-9833-76125acbab75'
		],
		miniatura:
			'https://firebasestorage.googleapis.com/v0/b/moonbeauty-9ba8f.firebasestorage.app/o/instagram%2Freel-DbebowUp1VB-poster.jpg?alt=media&token=d524343c-e735-435e-b3cd-33ab4775765d',
		permalink: 'https://www.instagram.com/reel/DbebowUp1VB/'
	},
	{
		tipo: 'video',
		archivos: [
			'https://firebasestorage.googleapis.com/v0/b/moonbeauty-9ba8f.firebasestorage.app/o/instagram%2Freel-DbPFGNnJvjR.mp4?alt=media&token=30d2c487-5189-4cd4-8e5d-0a95aed8d1ff'
		],
		miniatura:
			'https://firebasestorage.googleapis.com/v0/b/moonbeauty-9ba8f.firebasestorage.app/o/instagram%2Freel-DbPFGNnJvjR-poster.jpg?alt=media&token=0cd85243-e664-46a8-bc1c-fdd03ce0c94c',
		permalink: 'https://www.instagram.com/reel/DbPFGNnJvjR/'
	},
	{
		tipo: 'video',
		archivos: [
			'https://firebasestorage.googleapis.com/v0/b/moonbeauty-9ba8f.firebasestorage.app/o/instagram%2Freel-Da9GSHbJtIx.mp4?alt=media&token=28341be5-4b81-4991-ad4f-bf0634b15ec1'
		],
		miniatura:
			'https://firebasestorage.googleapis.com/v0/b/moonbeauty-9ba8f.firebasestorage.app/o/instagram%2Freel-Da9GSHbJtIx-poster.jpg?alt=media&token=70d810c4-628e-45ac-8211-61e88d3fd537',
		permalink: 'https://www.instagram.com/reel/Da9GSHbJtIx/'
	},
	{
		tipo: 'video',
		archivos: [
			'https://firebasestorage.googleapis.com/v0/b/moonbeauty-9ba8f.firebasestorage.app/o/instagram%2Freel-Da34I5IJgzU.mp4?alt=media&token=c6e92f02-0b6d-4906-8b61-bfb470223c90'
		],
		miniatura:
			'https://firebasestorage.googleapis.com/v0/b/moonbeauty-9ba8f.firebasestorage.app/o/instagram%2Freel-Da34I5IJgzU-poster.jpg?alt=media&token=21365717-8cec-4843-be0c-b95f4d2a973a',
		permalink: 'https://www.instagram.com/reel/Da34I5IJgzU/'
	}
];
