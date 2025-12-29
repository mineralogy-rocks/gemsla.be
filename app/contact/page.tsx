"use client";

import {useState} from "react";
import Link from "next/link";
import {Box, Button, Flex, Text, TextArea, TextField} from "@radix-ui/themes";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit form");
      }

      setStatus("success");
      setFormData({name: "", email: "", message: ""});
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  return (
    <div className="min-h-screen relative">
      <div
        className="fixed inset-0 z-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'url("/NNNoise Texture Generator.svg")',
          backgroundSize: "400px 400px",
          backgroundRepeat: "repeat",
        }}
      />

      <div className="relative z-10 px-4 sm:px-6 lg:px-8 pt-8">
        <div className="max-w-2xl mx-auto">
          <Link href="/"
                className="text-heading-pink hover:text-accent-rose transition-colors duration-300">
            ← Back to Home
          </Link>
        </div>
      </div>

      <section className="relative py-12 px-4 sm:px-6 lg:px-8 z-10">
        <div className="max-w-2xl mx-auto">
          <h1 className="monoton-heading text-3xl sm:text-4xl md:text-5xl text-center mb-12">
            GET IN TOUCH
          </h1>

          {status === "success" ? (
            <Box className="text-center py-12">
              <Text size="5" className="text-foreground mb-4 block">
                Thank you for your message!
              </Text>
              <Text size="3" className="text-text-gray block mb-8">
                I&apos;ll get back to you as soon as possible.
              </Text>
              <Button size="3"
                      variant="outline"
                      onClick={() => setStatus("idle")}
                      style={{cursor: "pointer"}}>
                Send Another Message
              </Button>
            </Box>
          ) : (
            <form onSubmit={handleSubmit}>
              <Flex direction="column" gap="5">
                <Box>
                  <Text as="label"
                        size="2"
                        weight="medium"
                        className="text-foreground mb-2 block">
                    Name
                  </Text>
                  <TextField.Root size="3"
                                  placeholder="Your name"
                                  value={formData.name}
                                  onChange={(e) =>
                                    setFormData({...formData, name: e.target.value})
                                  }
                                  required/>
                </Box>

                <Box>
                  <Text as="label"
                        size="2"
                        weight="medium"
                        className="text-foreground mb-2 block">
                    Email
                  </Text>
                  <TextField.Root size="3"
                                  type="email"
                                  placeholder="your.email@example.com"
                                  value={formData.email}
                                  onChange={(e) =>
                                    setFormData({...formData, email: e.target.value})
                                  }
                                  required/>
                </Box>

                <Box>
                  <Text as="label"
                        size="2"
                        weight="medium"
                        className="text-foreground mb-2 block">
                    Message
                  </Text>
                  <TextArea size="3"
                            placeholder="How can I help you?"
                            value={formData.message}
                            onChange={(e) =>
                              setFormData({...formData, message: e.target.value})
                            }
                            rows={6}
                            required/>
                </Box>

                {status === "error" && (
                  <Text size="2" color="red">
                    {errorMessage}
                  </Text>
                )}

                <Button size="3"
                        type="submit"
                        disabled={status === "loading"}
                        style={{cursor: status === "loading" ? "not-allowed" : "pointer"}}>
                  {status === "loading" ? "Sending..." : "Send Message"}
                </Button>
              </Flex>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
