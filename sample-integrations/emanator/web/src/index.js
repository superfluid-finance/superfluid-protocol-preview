import ReactDOM from 'react-dom'
import { RedwoodProvider, FatalErrorBoundary } from '@redwoodjs/web'
import FatalErrorPage from 'src/pages/FatalErrorPage'
import { ThemeProvider } from 'src/theme'
import Routes from 'src/Routes'

import DefaultLayout from 'src/layouts/DefaultLayout'

import './scaffold.css'

ReactDOM.render(
  <FatalErrorBoundary page={FatalErrorPage}>
    <RedwoodProvider>
      <ThemeProvider>
        <DefaultLayout>
          <Routes />
        </DefaultLayout>
      </ThemeProvider>
    </RedwoodProvider>
  </FatalErrorBoundary>,
  document.getElementById('redwood-app')
)
