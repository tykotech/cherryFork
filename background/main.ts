import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

serve(() => new Response('agent server running'), { port: 8080 })
