"use client";

import { travelStyles } from "@travel-buddy/validators";
import { useActionState } from "react";
import { saveProfileAction } from "./actions";

export function ProfileForm({
  homeCity,
  bio,
  languages,
  travelStyle,
}: {
  homeCity: string;
  bio: string;
  languages: string;
  travelStyle: string;
}) {
  const [state, formAction, pending] = useActionState(
    async (_state: { error?: string; saved?: true } | null, formData: FormData) => {
      return (await saveProfileAction(formData)) ?? null;
    },
    null,
  );

  return (
    <form action={formAction} className="mt-8 grid gap-6">
      <Field
        label="Home city"
        hint="Where you usually start a trip."
        name="homeCity"
        defaultValue={homeCity}
        placeholder="Kolkata"
      />
      <label className="grid gap-1.5 text-sm">
        <span className="font-medium">Languages</span>
        <span className="text-xs text-stone-500">
          So a group knows how you like to talk.
        </span>
        <input
          name="languages"
          defaultValue={languages}
          placeholder="English, Bengali"
          className={inputClass}
        />
      </label>
      <fieldset className="grid gap-2">
        <legend className="text-sm font-medium">Travel style</legend>
        <p className="text-xs text-stone-500">The pace you enjoy with other people.</p>
        <div className="mt-1 flex flex-wrap gap-2">
          {travelStyles.map((style) => (
            <label key={style.value} className="cursor-pointer">
              <input
                type="radio"
                name="travelStyle"
                value={style.value}
                defaultChecked={travelStyle === style.value}
                className="peer sr-only"
              />
              <span className="inline-flex rounded-full border border-stone-300 px-3 py-1.5 text-sm peer-checked:border-stone-900 peer-checked:bg-stone-900 peer-checked:text-white dark:border-stone-700 dark:peer-checked:border-stone-100 dark:peer-checked:bg-stone-100 dark:peer-checked:text-stone-900">
                {style.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="grid gap-1.5 text-sm">
        <span className="font-medium">Bio</span>
        <span className="text-xs text-stone-500">
          A sentence other travelers can read before a trip.
        </span>
        <textarea
          name="bio"
          rows={4}
          defaultValue={bio}
          placeholder="Slow mornings, one good meal, and a walk without a plan."
          className={inputClass}
        />
      </label>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60 dark:bg-stone-100 dark:text-stone-900"
        >
          {pending ? "Saving" : "Save profile"}
        </button>
        {state?.saved ? <p className="text-sm text-stone-500">Saved</p> : null}
        {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  name,
  defaultValue,
  placeholder,
}: {
  label: string;
  hint: string;
  name: string;
  defaultValue: string;
  placeholder: string;
}) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      <span className="text-xs text-stone-500">{hint}</span>
      <input
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className={inputClass}
      />
    </label>
  );
}

const inputClass =
  "rounded-lg border border-stone-300 bg-transparent px-3 py-2 outline-none placeholder:text-stone-400 focus:border-stone-900 dark:border-stone-700 dark:focus:border-stone-100";
