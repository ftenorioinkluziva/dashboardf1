# Pasta de Imagens

Esta pasta contém todas as imagens utilizadas no projeto F1 Dashboard.

## Estrutura de Pastas

- `/drivers`: Imagens dos pilotos
- `/teams`: Logos e cores das equipes
- `/circuits`: Imagens dos circuitos
- `/icons`: Ícones específicos do projeto
- `/backgrounds`: Imagens de fundo

## Como usar

Para usar uma imagem em um componente, importe-a usando o componente Image do Next.js:

\`\`\`jsx
import Image from 'next/image'

// Exemplo de uso
<Image 
  src="/images/drivers/hamilton.jpg" 
  alt="Lewis Hamilton" 
  width={200} 
  height={200} 
/>
\`\`\`

Ou para um background em CSS:

\`\`\`jsx
<div 
  className="..." 
  style={{ backgroundImage: "url('/images/backgrounds/circuit-bg.jpg')" }}
>
