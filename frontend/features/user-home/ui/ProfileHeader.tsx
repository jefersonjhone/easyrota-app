import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/lib/ui/avatar"
import {
  CalendarBlankIcon,
  IdentificationBadgeIcon,
  UserSquareIcon,
} from "@phosphor-icons/react"

import type { ProfileUser } from "@/features/user-home/types"


const get_initials = (name: string) => {
  const initials = name.split(' ')
  if (initials.length === 1) {
    return name.length > 1 ? name.slice(0, 2).toUpperCase() : `${name[0]}${name[0]}`.toUpperCase()
  }
   return initials.map(n => n[0]).join('').toUpperCase()
}

export default function ProfileHeader({ user }: { user: ProfileUser }) {
  
  return (
    <header className='w-full'>
      <div className='w-full h-26 md:h-42 bg-linear-to-r from-slate-300 to-slate-200' />
      
      <div className='max-w-4xl mx-auto px-4 pb-4'>
        
        <div className='flex gap-4 -mt-12 md:-mt-18 justify-between '>
          <div className='shrink-0'>
            <Avatar className='w-22 h-22 md:w-32 md:h-32 border-4 md:border-6 border-white'>
              <AvatarImage src='/avatar.png' alt='João da Silva' />
              <AvatarFallback className='text-4xl font-bold '>{get_initials(user.full_name)}</AvatarFallback>
            </Avatar>
            
            <div className='flex flex-col pb-2 m-0 '>
                <h1 className='text-lg md:text-2xl font-bold '>{user.full_name}</h1>
                <p className='text-gray-500 text-base'>{user.email}</p>
              <div className="text-sm sm:text-base font-">
                <p className='text-gray-600 mt-1 md:mt-2'>
                  <UserSquareIcon className='inline-block mr-1' />
                  <span>
                    Perfil: {user.profile_type}
                  </span>
                </p>
                
              <p className='text-gray-600 '>
                <IdentificationBadgeIcon className='inline-block mr-1' />
                <span className="">
                  
                  Matrícula: {user.student_id ?? user.civil_servant_id}
                </span>
              </p>
                <p className='text-gray-600'>
                  <CalendarBlankIcon className='inline-block mr-1' />
                  <span>Ingressou em {user.joined_at}</span>
                </p>
              </div>
              </div>
          </div>

          <div className='flex gap-2 items-start pt-2 mt-4 md:mt-10'>
            <button
              className='px-4 md:px-8 py-2 bg-slate-400  text-sm text-white border border-white
              rounded-full font-medium md:font-bold hover:opacity-90' 
              onClick={()=>{alert("um dia teremos um modal de configurações")}}
            >
              Configurações
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}