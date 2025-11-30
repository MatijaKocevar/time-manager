import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UserForm } from "../components/user-form"

export default async function CreateUserPage() {
    return (
        <div className="container max-w-2xl py-6">
            <Card>
                <CardHeader>
                    <CardTitle>Create User</CardTitle>
                    <CardDescription>Add a new user to the system</CardDescription>
                </CardHeader>
                <CardContent>
                    <UserForm />
                </CardContent>
            </Card>
        </div>
    )
}
