import ReactDOM from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { I18nextProvider } from 'react-i18next'

import App from './App'
import { i18n } from './i18n/config'
import { queryClient } from './lib/query-client'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <I18nextProvider i18n={i18n}>
    <QueryClientProvider client={queryClient}>
      <App />
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  </I18nextProvider>
)
