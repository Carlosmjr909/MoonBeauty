<script>
    import Icon from "@iconify/svelte";
</script>

<section class="bg-slate-50 p-12 flex">
    <form action="" class="bg-white py-12 px-16 flex flex-col w-150 rounded-4xl space-y-2 flex-1">
        <div>
            <p class="text-3xl font-PlayFair">Crea tu cuenta</p>
            <p class="text-lg font-BeVietnam">
                Unete al ritual de belleza coreana y descrube tu luminosidad
                interior
            </p>
            </div>
            <div class="py-3">
                <p class="font-BeVietnam text-sm">NOMBRE COMPLETO</p>
                <input type="text" placeholder="Ej. Ana Garcia" class="bg-gray-50 rounded-3xl text-gray-400" />
            </div>
            <div>
            <p class="text-sm font-BeVietnam">CORREO ELECTRONICO</p>
            <input type="email" name="" id="" placeholder="tu@ejemplo.com" class="bg-gray-50 rounded-3xl text-gray-400"/>
            </div>
        <div class="my-4 flex space-x-28">
            <p class="text-sm font-BeVietnam">CONTRASEÑA</p>
            <p class="font-BeVietnam">CONFIRMAR CONTRASEÑA</p>
            
        </div>
        <div>
            <input type="password" name="" id="" placeholder="••••••••" class="bg-gray-50 rounded-3xl text-gray-400 text-center"/>
            <input type="password" name="" id="" placeholder="••••••••" class="bg-gray-50 rounded-3xl text-gray-400 text-center"/>
        </div>
        <div class="flex space-x-4 py-2">
            <input type="checkbox" name="" id="" />
            <p class="font-BeVietnam">
                Acepto los terminos y condiciones y la politica de privacidad de
                MoonBeauty.
            </p>
        </div>
        <div class="py-2 space-y-1">
            <button class="bg-slate-500 text-white w-full h-12 rounded-4xl shadow-xl" type="submit">CREAR CUENTA</button>
            <div class="flex flex-row items-center py-4">
            <div class="flex-1 h-px bg-gray-400"></div>
                <p class="px-4 text-gray-400">o</p>
                <div class="flex-1 h-px bg-gray-400"></div>
            </div>
        <div class="bg-gray-50 rounded-2xl w-full h-12 text-lg flex justify-center items-center space-x-4">
            <Icon icon="material-icon-theme:google" width="25px" />
        <button class="font-BeVietnam">Registrarse con google</button>
        </div>
        </div>
        <div class="flex space-x-4 py-2 justify-center">
            <p class="font-BeVietnam">¿Ya tienes una cuenta?</p>
            <a class="text-slate-500 font-BeVietnam" href="login">Iniciar sesion</a>
        </div>
    </form>

    <div class="px-24 overflow-hidden relative flex-2">
        <img src="/imagen fondo login.webp" alt="" class="rounded-4xl w-full h-175">
    </div>
</section>
