'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Box,
  Stack,
} from '@mui/material'
import { AutoAwesome, Shuffle } from '@mui/icons-material'
import { MarketForm } from '@/types'

// Random market questions with outcomes
const RANDOM_QUESTIONS = [
  {
    question: 'Will Bitcoin reach $100k by end of 2024?',
    outcomes: 'Yes, No',
    duration: 72,
  },
  {
    question: 'Will Ethereum hit $5,000 before December 2024?',
    outcomes: 'Yes, No',
    duration: 48,
  },
  {
    question: 'Will the S&P 500 close above 5,500 by end of 2024?',
    outcomes: 'Yes, No',
    duration: 72,
  },
  {
    question: 'Will Apple stock reach $200 by Q1 2025?',
    outcomes: 'Yes, No',
    duration: 96,
  },
  {
    question: 'Will there be a major crypto exchange hack in the next 30 days?',
    outcomes: 'Yes, No',
    duration: 30,
  },
  {
    question: 'Will the Fed cut interest rates in the next meeting?',
    outcomes: 'Yes, No, Hold',
    duration: 24,
  },
  {
    question: 'Will Tesla stock be above $250 by end of month?',
    outcomes: 'Yes, No',
    duration: 48,
  },
  {
    question: 'Will gold price exceed $2,500/oz by end of 2024?',
    outcomes: 'Yes, No',
    duration: 72,
  },
  {
    question: 'Will the next Bitcoin halving cause price to surge above $150k?',
    outcomes: 'Yes, No',
    duration: 168,
  },
  {
    question: 'Will AI stocks (NVDA, MSFT) outperform the market this quarter?',
    outcomes: 'Yes, No, Tie',
    duration: 96,
  },
]

const getRandomQuestion = (): MarketForm => {
  const random = RANDOM_QUESTIONS[Math.floor(Math.random() * RANDOM_QUESTIONS.length)]
  return {
    question: random.question,
    outcomes: random.outcomes,
    duration: random.duration,
  }
}

interface MarketCreationFormProps {
  onSubmit: (form: MarketForm) => void
  onGenerateAI: () => void
  isSubmitting: boolean
  isGeneratingAI?: boolean
  form?: MarketForm
  onFormChange?: (form: MarketForm) => void
}

export default function MarketCreationForm({
  onSubmit,
  onGenerateAI,
  isSubmitting,
  isGeneratingAI = false,
  form: externalForm,
  onFormChange,
}: MarketCreationFormProps) {
  const [internalForm, setInternalForm] = useState<MarketForm>({
    question: '',
    outcomes: '',
    duration: 72,
  })

  const form = externalForm ?? internalForm
  const setForm = onFormChange ?? setInternalForm

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(form)
  }

  const handleRandomQuestion = () => {
    const random = getRandomQuestion()
    setForm(random)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Create New Market
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Question"
              value={form.question}
              onChange={(e) => setForm({ ...form, question: e.target.value })}
              placeholder="Will Bitcoin reach $100k by end of 2024?"
              required
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Outcomes (comma-separated)"
              value={form.outcomes}
              onChange={(e) => setForm({ ...form, outcomes: e.target.value })}
              placeholder="Yes, No"
              required
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              type="number"
              label="Duration (hours)"
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) })}
              inputProps={{ min: 1, max: 168 }}
              required
              sx={{ mb: 2 }}
            />
            <Stack direction="row" spacing={2} flexWrap="wrap">
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting || isGeneratingAI}
              >
                {isSubmitting ? 'Processing...' : 'Create Market'}
              </Button>
              <Button
                type="button"
                variant="outlined"
                startIcon={<Shuffle />}
                onClick={handleRandomQuestion}
                disabled={isSubmitting || isGeneratingAI}
              >
                Random Question
              </Button>
              <Button
                type="button"
                variant="contained"
                color="secondary"
                startIcon={<AutoAwesome />}
                onClick={onGenerateAI}
                disabled={isGeneratingAI || isSubmitting}
              >
                {isGeneratingAI ? 'Generating...' : 'Generate with AI'}
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  )
}

