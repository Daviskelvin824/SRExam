import React, { ReactNode } from 'react'
import Navbar from '../components/navbar'
import { Container, CssBaseline, PaletteMode, createTheme } from '@mui/material'
import getLPTheme from '../components/getLPTheme'
import { ThemeProvider } from '@emotion/react'
interface Props {
    content:ReactNode
}

const Layout = ({ content }: Props) => {
    const [mode, setMode] = React.useState<PaletteMode>('dark');
    const LPtheme = createTheme(getLPTheme(mode));
    return (
      <ThemeProvider theme={LPtheme} >
        <CssBaseline />
        <Navbar />
        <Container maxWidth={false} sx={{
            pt: { xs: 13, sm: 13 },
            pb: { xs: 8, sm: 9 },
            pl: {xs:4,sm:4},
            pr: {xs:4,sm:4}
          }}
          >
          
          {content}
          
        </Container>
      </ThemeProvider>
    )
  }
  
export default Layout