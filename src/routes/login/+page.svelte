<script>
    import Icon from "@iconify/svelte";
</script>

<section class="bg-gray-50 flex">
    <form action="" class="bg-white flex flex-col w-150 py-24 px-12 flex-1">
        <div class="space-y-2">
            <p class="text-center font-PlayFair text-slate-500 text-3xl">MoonBeauty</p>
            <p class="text-lg font-BeVietnam text-center">El ritual de tu bienestar comienza aqui</p>
        </div>
        <div class="my-6">
            <p class="font-BeVietnam">correo electronico</p>
            <input type="email" name="" id="" placeholder="tu@ejemplo.com" class="shadow-xs rounded-3xl w-full text-gray-400" />
        </div>
        <div>
            <p class="font-BeVietnam">contraseña</p>
            <input type="password" name="" id="" placeholder="●●●●●●●●" class="shadow-xs rounded-3xl w-full text-gray-400"/>
        </div>
        <div class="flex my-8 space-x-2 justify-center">
            <input type="checkbox" name="" id="">
            <p>Recordarme</p>
            <div class="mx-14">
                <a class="text-slate-500" href="">¿Olvidaste tu contraseña?</a>
            </div>
        </div>
        <div class="flex flex-col items-center">
            <button class="bg-slate-500 w-full h-12 text-lg text-white rounded-3xl font-BeVietnam" type="submit">Iniciar Sesion</button>
            <p class="text-gray-400 py-6">o continua con</p>

            <div class="bg-gray-50 w-full h-10 rounded-3xl flex justify-center items-center space-x-2">
            <Icon icon="material-icon-theme:google" width="25px" />
            <button class="font-BeVietnam">Google</button>
            </div>
        </div>

        <div class="flex justify-center space-x-8 my-12">
            <p>¿Aun no tienes cuenta?</p>
            <a class="text-slate-500" href="create_account">Crear una cuenta</a>
        </div>
    </form>
    <div class="flex-2 overflow-hidden relative">
        <img src="fondo inicio de sesion 2.webp" alt="" class="w-full h-195">
    </div>
</section>
