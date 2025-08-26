import React from 'react'
import { cn } from "@/lib/utils"

const Title = ({title, subTitle, align, font, className}) => {
  return (
    <div className={cn(`flex flex-col justify-center items-center text-center ${align === "left" && "md:items-start md:text-left"}`, className)}>
      <h1 className={`text-4xl md:text-[40px] ${font || 'font-playfair'}`}>{title}</h1>
      <p className={`text-sm md:text-base text-gray-500/90 mt-2 max-w-174`}>{subTitle}</p>
    </div>
  )
}

export default Title