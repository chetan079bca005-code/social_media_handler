import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'

export function Inbox() {
  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Inbox</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-500">No messages yet. Connect social accounts to see inbound comments and messages.</p>
        </CardContent>
      </Card>
    </div>
  )
}
