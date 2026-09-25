import { SignUp } from "@clerk/nextjs";
import { AuthLayout } from "@/components/auth-layout";

export default function SignUpPage() {
  return (
    <AuthLayout mode="sign-up">
      <SignUp
        fallbackRedirectUrl="/auth-redirect"
        signInFallbackRedirectUrl="/auth-redirect"
        appearance={{
          elements: {
            rootBox: "w-full mx-auto",
            cardBox: "w-full shadow-none border-0 bg-transparent",
            card: "w-full shadow-none border-0 bg-transparent p-0",
            headerTitle: "text-foreground font-heading font-bold text-xl tracking-tight",
            headerSubtitle: "text-muted-foreground text-sm",
            socialButtonsBlockButton:
              "border border-input bg-background hover:bg-muted text-foreground transition-all font-medium h-10 rounded-lg shadow-xs",
            socialButtonsBlockButtonText: "font-medium text-foreground text-sm",
            dividerLine: "bg-border",
            dividerText: "text-muted-foreground text-xs uppercase tracking-wider",
            formFieldLabel: "text-foreground text-sm font-medium",
            formFieldInput:
              "bg-background border border-input text-foreground focus-visible:ring-1 focus-visible:ring-ring rounded-lg h-10 text-sm shadow-xs transition-colors",
            formButtonPrimary:
              "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm font-medium h-10 rounded-lg transition-colors text-sm",
            footerActionLink:
              "text-primary hover:text-primary/80 font-medium underline-offset-4 hover:underline",
            footerActionText: "text-muted-foreground text-sm",
            identityPreviewText: "text-foreground font-medium",
            identityPreviewEditButton: "text-primary hover:text-primary/80",
            formFieldAction: "text-xs text-primary hover:underline",
            alertText: "text-sm",
            footer: "pt-4",
          },
        }}
      />
    </AuthLayout>
  );
}

