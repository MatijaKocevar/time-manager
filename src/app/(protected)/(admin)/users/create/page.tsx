import { Card, CardContent } from "@/components/ui/card"
import { UserForm } from "../components/user-form"

export default async function CreateUserPage() {
    return (
        <Card>
            <CardContent>
                <UserForm />
            </CardContent>
        </Card>
    )
}
