from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Annotated, Union
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableLambda
from langchain_core.output_parsers import PydanticOutputParser
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.output_parsers import OutputFixingParser
from langchain.prompts import PromptTemplate, FewShotPromptTemplate
from datetime import datetime
import time


import os
from dotenv import load_dotenv

# Load environment variables from a .env file in the root directory
load_dotenv()

# --- Configuration ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

llm_text_insights = ChatGoogleGenerativeAI(model = 'gemini-2.0-flash', google_api_key = GEMINI_API_KEY)
llm_for_parsing = ChatGoogleGenerativeAI(model="gemini-1.5-flash", google_api_key= GEMINI_API_KEY)
llm_for_fixing = ChatGoogleGenerativeAI(model="gemini-1.5-flash", google_api_key= GEMINI_API_KEY)

# --- Client Initialization ---
if not GEMINI_API_KEY:
    raise ValueError(
        "GEMINI_API_KEY not found in environment variables. "
        "Please create a .env file in the project root and set the key."
    )


# --- File Identification ---
file_extension_list = {
    'audio': ["aac", "mid", "mp3", "m4a", "ogg", "flac", "wav", "amr", "aiff"],
    'image': ["dwg", "xcf", "jpg", "jpx", "png", "apng", "gif", "webp", "cr2", "tif", "bmp", "jxr", "psd", "ico", "heic", "avif"],
    'text': ["csv"]
}

# get file path
def get_file_path(file):
  return list(file.keys())[0]

# function to returning file type (audio, image, or text)
def identify_filetype(file):
  file_extension = os.path.splitext(get_file_path(file))[1]
  for key, value in file_extension_list.items():
    if file_extension[1:].lower() in value:
      return key
  return 'Error: FileType Not Supported'

# --- Classification Examples ---
ctt_examples = [{'input': 'There is an unauthorized charge on my BPI Family Savings credit card statement. Please investigate.',
  'output': 'Complaint'},
 {'input': 'Pwede ko po bang malaman kung anong mga options para mag-apply ng loan online?',
  'output': 'Inquiry'},
 {'input': '["Hi po! I\'d like to know the requirements for BPI Auto Loan. Planning to get a brand new SUV.", "I\'m employed. Thanks!"]',
  'output': 'Inquiry'},
 {'input': 'Hello, I want to inquire about the process of opening a BPI Kaya Secure Savings account.',
  'output': 'Inquiry'},
 {'input': "['User: I have a problem. My BPI credit card has an unauthorized transaction.', 'Chatbot: I understand. Please provide the date, amount and merchant of the suspicious charge.', 'User: April 1st, 2026, â‚±3000, Zalora', 'Chatbot: Thank you. We have filed a dispute report. Please wait for our investigation results within 7 business days.']",
  'output': 'Complaint'},
 {'input': 'What are the steps to open a joint savings account with BPI?',
  'output': 'Inquiry'},
 {'input': "['How to get a new BPI ATM?', 'Kasi My card will expire soon what i supposed to do?', 'Please check your best to respond thanks po.']",
  'output': 'Request'},
 {'input': 'Hi, BPI! I forgot my online banking password. How can I reset it?',
  'output': 'Request'},
 {'input': 'Hi BPI! I lost my credit card. How do I report it?',
  'output': 'Request'},
 {'input': 'I want to know how much my credit card balance is and when is the due date. Thanks!',
  'output': 'Inquiry'}]
cpl_examples = [{'input': 'There is an unauthorized charge on my BPI Family Savings credit card statement. Please investigate.',
  'output': 'High'},
 {'input': 'Pwede ko po bang malaman kung anong mga options para mag-apply ng loan online?',
  'output': 'Medium'},
 {'input': '["Hi po! I\'d like to know the requirements for BPI Auto Loan. Planning to get a brand new SUV.", "I\'m employed. Thanks!"]',
  'output': 'Medium'},
 {'input': 'Hello, I want to inquire about the process of opening a BPI Kaya Secure Savings account.',
  'output': 'Medium'},
 {'input': "['User: I have a problem. My BPI credit card has an unauthorized transaction.', 'Chatbot: I understand. Please provide the date, amount and merchant of the suspicious charge.', 'User: April 1st, 2026, â‚±3000, Zalora', 'Chatbot: Thank you. We have filed a dispute report. Please wait for our investigation results within 7 business days.']",
  'output': 'High'},
 {'input': 'What are the steps to open a joint savings account with BPI?',
  'output': 'Low'},
 {'input': "['How to get a new BPI ATM?', 'Kasi My card will expire soon what i supposed to do?', 'Please check your best to respond thanks po.']",
  'output': 'High'},
 {'input': 'Hi, BPI! I forgot my online banking password. How can I reset it?',
  'output': 'High'},
 {'input': 'Hi BPI! I lost my credit card. How do I report it?',
  'output': 'High'},
 {'input': 'I want to know how much my credit card balance is and when is the due date. Thanks!',
  'output': 'Low'}]

ct_examples = [{'input': 'There is an unauthorized charge on my BPI Family Savings credit card statement. Please investigate.',
  'output': 'Credit Cards'},
 {'input': 'Pwede ko po bang malaman kung anong mga options para mag-apply ng loan online?',
  'output': 'Loans'},
 {'input': '["Hi po! I\'d like to know the requirements for BPI Auto Loan. Planning to get a brand new SUV.", "I\'m employed. Thanks!"]',
  'output': 'Loans'},
 {'input': 'Hello, I want to inquire about the process of opening a BPI Kaya Secure Savings account.',
  'output': 'Deposits'},
 {'input': "['User: I have a problem. My BPI credit card has an unauthorized transaction.', 'Chatbot: I understand. Please provide the date, amount and merchant of the suspicious charge.', 'User: April 1st, 2026, â‚±3000, Zalora', 'Chatbot: Thank you. We have filed a dispute report. Please wait for our investigation results within 7 business days.']",
  'output': 'Credit Cards'},
 {'input': 'What are the steps to open a joint savings account with BPI?',
  'output': 'Deposits'},
 {'input': "['How to get a new BPI ATM?', 'Kasi My card will expire soon what i supposed to do?', 'Please check your best to respond thanks po.']",
  'output': 'Deposits'},
 {'input': 'Hi, BPI! I forgot my online banking password. How can I reset it?',
  'output': 'Deposits'},
 {'input': 'Hi BPI! I lost my credit card. How do I report it?',
  'output': 'Credit Cards'},
 {'input': 'I want to know how much my credit card balance is and when is the due date. Thanks!',
  'output': 'Credit Cards'}]

sentiment_examples = [{'input': 'There is an unauthorized charge on my BPI Family Savings credit card statement. Please investigate.',
  'output': 'Negative'},
 {'input': 'Pwede ko po bang malaman kung anong mga options para mag-apply ng loan online?',
  'output': 'Positive'},
 {'input': '["Hi po! I\'d like to know the requirements for BPI Auto Loan. Planning to get a brand new SUV.", "I\'m employed. Thanks!"]',
  'output': 'Positive'},
 {'input': 'Hello, I want to inquire about the process of opening a BPI Kaya Secure Savings account.',
  'output': 'Positive'},
 {'input': "['User: I have a problem. My BPI credit card has an unauthorized transaction.', 'Chatbot: I understand. Please provide the date, amount and merchant of the suspicious charge.', 'User: April 1st, 2026, â‚±3000, Zalora', 'Chatbot: Thank you. We have filed a dispute report. Please wait for our investigation results within 7 business days.']",
  'output': 'Negative'},
 {'input': 'What are the steps to open a joint savings account with BPI?',
  'output': 'Positive'},
 {'input': "['How to get a new BPI ATM?', 'Kasi My card will expire soon what i supposed to do?', 'Please check your best to respond thanks po.']",
  'output': 'Neutral'},
 {'input': 'Hi, BPI! I forgot my online banking password. How can I reset it?',
  'output': 'Positive'},
 {'input': 'Hi BPI! I lost my credit card. How do I report it?',
  'output': 'Neutral'},
 {'input': 'I want to know how much my credit card balance is and when is the due date. Thanks!',
  'output': 'Positive'}]

# --- Pydantic Models
class GeneralInfo(BaseModel):
  case_id: Optional[str] = Field(None, description="An unique identifier given to each case message")
  raw_message: str = Field(None, description="The raw and unstructured form of the original message or conversation")
  message_source: Literal['Email', 'Phone', 'Branch', 'Facebook'] = Field(None, description="The channel to which the text was received from")
  customer_tier: Optional[Literal['High', 'Mid', 'Low']] = Field(None, description="The tier of the customer sending the message")
  status: Optional[Literal['New', 'Assigned', 'Closed']] = Field(None, description="The status of the message, whether it was new, already assigned, or closed")
  start_date: Optional[datetime] = Field(None, description="The date and time when the message was initiated or received.")
  close_date: Optional[datetime] = Field(None, description="The date and time when the message was marked as closed or resolved.")

class TextOverview(BaseModel):
  summary: str = Field(None, description="A one liner summary of the text provided. Indicates the main purpose and intention of the text. Use proper case.")
  tags: List[str] = Field(None, description="A list of keywords that can be used to tag and classify the message meaningfuly. Use lowercase")

class TransactionType(BaseModel):
  interaction_type: Literal['Request', 'Inquiry', 'Complaint'] = Field(None, description="The interaction type of the message, indicates whether the customer is inquiring, complaining, or requesting to the bank")
  product_type: Literal['Credit Cards', 'Deposits', 'Loans'] = Field(None, description="The product that is best connected to the purpose of the message. Indicates if the message is related to Credit Cards, Deposits, or Loans")

class SentimentConfidence(BaseModel):
  sentiment_tag: str = Field(None, description="The sentiment tag being assessed. Can be either 'Positivee', 'Negative', or 'Neutral")
  sentiment_confidence_score: Optional[float] = Field(None, ge=0.0, le=1.0, description="how confident the given sentiment category is when associated with the intent of the message. Use two decimal points for the score")
  emotional_indicators: Optional[List[str]] = Field(None, description="Bigrams or trigrams that best display the particular sentiment of the message. Use lowercase. Use 'Blank' if there is no good keyword.")

class Sentiment(BaseModel):
  sentiment_category: Literal['Negative', 'Neutral', 'Positive'] = Field(None, description="the sentiment demonstrated within the message. Indicates whether the message has negative, positive, or neutral connotations")
  sentiment_reasoning: Optional[str] = Field(None, description="A one liner that depicts main reason why the text was categorized as a certain sentiment. No need to add any emphases on keywords. Use proper case.")
  sentiment_distribution: List[SentimentConfidence] = Field(description="A distribution that shows how likely each sentiment (Positive, Neutral, and Negative). Note that the sum of the confidence scores should be equal to 1.0 since it's a probability distribution")

class Urgency(BaseModel):
  priority_category: Literal['High', 'Medium', 'Low'] = Field(None, description = "Describes how urgent a message needs to be addressed.")
  priority_reason: Optional[str] = Field(None, description = "An explanation of why the priority level of a message is the way it is.")

class ChatLogEntry(BaseModel):
  turn_id: int = Field(None, description="A number that indicates the order in which the message is found in the conversation")
  speaker: Literal['Customer', 'Bank Agent', 'Chatbot']  = Field(None, description="The entity who sent the message during the specified turn")
  text: str = Field(None, description="The message sent within the turn of the speaker")

class DialogueHistory(BaseModel):
  dialogue_history: List[ChatLogEntry] = Field(
      default_factory=list, description="A record of the chat history with a breakdown of the order of the message, the person who sent the message, and the message itself."
  )

class TextInsightStructured(BaseModel):
  general_information: GeneralInfo = Field(description="Contains the background information attached to a message sent. This is given by the user. If none is provided, put 'Blank'.")
  text_overview: TextOverview = Field(description="Provide a brief overview of key information about the message")
  urgency: Urgency = Field(description="Provides information about the urgency of the message.")
  transaction_type: TransactionType = Field(description="Provides information about the type of transaction related to the message")
  sentiment: Sentiment = Field(description="Provides information about the sentiments and indicators of sentiment that can be extracted from the message")
  dialogue_history: List[ChatLogEntry] = Field(
      default_factory=list, description="A record of the chat history with a breakdown of the order of the message, the person who sent the message, and the message itself."
  )

sentiment_parser = PydanticOutputParser(pydantic_object=Sentiment)
transaction_type_parser = PydanticOutputParser(pydantic_object=TransactionType)
urgency_parser = PydanticOutputParser(pydantic_object=Urgency)
dialogue_history_parser = PydanticOutputParser(pydantic_object=DialogueHistory)
text_insight_parser = PydanticOutputParser(pydantic_object=TextInsightStructured)

# --- Prompt Templates ---

ctt_prompt = PromptTemplate.from_template(
    """You are an expert contact center operations agent and analyst at a banking firm. Your task is to review customer messages and classify each message by selecting exactly one label from the following list: ['Request', 'Inquiry', 'Complaint'].
    For each message, return only one word. That is, the label, in proper case.
    Please ensure that the classification you will give is based on the main intent of the message.

    TRANSACTION TYPE DEFINITION AND GUIDELINES
    Complaint:
    - if Customer states a situation that is considered detrimental or unfavorable to the bank (e.g., errors, unresponsive personnel, personal dissatisfaction, etc.)

    Inquiry:
    - if Customer asks for information about a bank product or service that they wish to avail
    - if Customer asks for something but no immediate action must be done

    Request:
    - if Customer asks for something that the bank can do for them (e.g., asking for bank statements, unlocking cards, notifying lost cards, etc.)
    - if Customer asks for something that will be succeeded by an action on their end (e.g., resetting password/PIN, closing accounts, etc.)

    Classify the following text: {text_to_classify}. Return only the label as output. No explanations needed."""
)

example_formatter = PromptTemplate.from_template(
    "Input: {input} \n Output: {output}"
)

ctt_fewshot_prompt = FewShotPromptTemplate(
    examples = ctt_examples,
    example_prompt = example_formatter,
    suffix = ctt_prompt.template,
    input_variables = ['text_to_classify'],
    example_separator = "\n\n"
)

ctt_chain_fs = ctt_fewshot_prompt | llm_text_insights

ctt_chain_wrapped = RunnableLambda(lambda x: {
    "text_to_classify": x["text"]
}) | ctt_chain_fs


cpl_prompt = PromptTemplate.from_template(
    """You are an expert contact center operations agent and analyst at a banking firm. Your task is to review customer messages and classify each message by selecting exactly one label from the following priority levels: ['High', 'Medium', 'Low'].
    For each message, return only one word. That is, the label, in proper case.
    Please ensure your classification is based on the main intent of the message.
    Take into account the nature of the customer message and the gravity of supposed issue on personal and historical data to classify the message.

    PRIORITY DEFINITIONS AND GUIDELINES:
    High: - Urgent issues, complaints, or problems requiring immediate resolution. - Fraud, unauthorized transactions, or security breaches. - Account lockouts or inability to access funds. - Time-sensitive concerns with direct financial impact or security risks.
    Medium: - Customer expressing clear interest in availing a service or applying for a product (e.g., opening an account, applying for a loan, requesting a credit card). - General product/service inquiries with clear indicators of active interest. - Scheduling appointments related to new services or significant account changes.
    Low: - General inquiries without a clear indicator of active interest or intent to avail a service. - Requests for descriptive information without clear business growth potential or direct impact. - Feedback, suggestions, marketing responses, or survey participation. - Requests with no urgency or direct impact on account access, security, or immediate financial transactions.

    Moreover, using one sentence, indicate the reason why the message is classified its priority level.

    Follow the format below:
    {format_instructions}

    Classify the following text: {text_to_classify}."""
)

cpl_fewshot_prompt = FewShotPromptTemplate(
    examples = cpl_examples,
    example_prompt = example_formatter,
    suffix = cpl_prompt.template,
    input_variables = ['text_to_classify'],
    partial_variables = {'format_instructions': urgency_parser.get_format_instructions()},
    example_separator = "\n\n"
)

cpl_chain_fs = cpl_fewshot_prompt | llm_text_insights

cpl_chain_wrapped = RunnableLambda(lambda x: {
    "text_to_classify": x["text"]
}) | cpl_chain_fs | RunnableLambda(lambda x: urgency_parser.parse(x.content).model_dump_json(indent=2))

ct_prompt = PromptTemplate.from_template(
    """You are an expert contact center operations agent and analyst at a banking firm. Your task is to review customer messages and classify each message by selecting exactly one label from the following services/products offered by the bank: "labels": ['Credit Cards', 'Loans', 'Deposits'].
    For each message, return only one word. That is, the label, in proper case.
    Please ensure your classification is based on the main intent of the message.
    Take into account the nature of the customer message and the proximity of the message to the aforementioned services/products to classify the message.

    Classify the following text: {text_to_classify}. Return only the label as output. No explanations needed."""
)

ct_fewshot_prompt = FewShotPromptTemplate(
    examples = ct_examples,
    example_prompt = example_formatter,
    suffix = ct_prompt.template,
    input_variables = ['text_to_classify'],
    example_separator = "\n\n"
)

ct_chain_fs = ct_fewshot_prompt | llm_text_insights

ct_chain_wrapped = RunnableLambda(lambda x: {
    "text_to_classify": x["text"]
}) | ct_chain_fs

sentiment_prompt = PromptTemplate.from_template(
    """You are an expert contact center operations agent and analyst at a banking firm. Analyze the customer messages below and classify their overall emotional sentiment based on the customer's tone and intent. Choose from: ['Positive', 'Negative', 'Neutral'].
    Base your answer on whether the customer is satisfied, complaining, confused, or asking politely.
    Do NOT get distracted by polite greetings like 'Hi' or 'Good day', as well as "Thanks". Do not include them in your analysis and focus on the real intent. Respond with one word per text.
    If you encounter a list of messages that looks like a customer-chatbot interaction signified by "User:" and "Chatbot:" in the message, focus on the first few messages of the USER only.

    SENTIMENT DEFINITIONS AND GUIDELINES:
    Positive: If a customer expresses interest in applying for a product, making a transaction, even if the tone is neutral.
    Neutral: If a customer expresses curiosity or questions the process but has not shown interest or if a customer want to make a request unrelated to concern, then it is also Neutral (e.g. request for statement)
    Negative: If a customer expresses desire to leave or switch to another bank, classify it as Negative, even if the tone is neutral.

    Make sure to provide a reasoning. Provide also a distribution of confidence score (0.0 to 1.0) for the three labels and make sure they add up to 1.0. For each sentiment, give also the keywords that can be attributed to that sentiment.

    {format_instructions}

    Classify the following text: {text_to_classify}."""
)

sentiment_fewshot_prompt = FewShotPromptTemplate(
    examples = sentiment_examples,
    example_prompt = example_formatter,
    suffix = sentiment_prompt.template,
    input_variables = ['text_to_classify'],
    partial_variables = {"format_instructions": sentiment_parser.get_format_instructions()},
    example_separator = "\n\n"
)

sentiment_chain_fs = sentiment_fewshot_prompt | llm_text_insights

sentiment_chain_wrapped = RunnableLambda(lambda x: {"text_to_classify": x["text"]}) | sentiment_chain_fs | RunnableLambda(lambda x: sentiment_parser.parse(x.content).model_dump_json(indent=2))

summary_prompt = PromptTemplate.from_template(
    """You are an expert contact center operations agent and analyst at a banking firm.
    Your task is to extract significant insight and information from customer messages, and summarize the key ideas from a message in one sentence.
    Take note that the messages come from customers interacting with a bank.
    If you encounter a list of messages that looks like a customer-chatbot interaction signified by "User:" and "Chatbot:" in the message, synthesize what they talked about. Focus on the customer and just add what the chatbot did.

    Summarize the following message in no more than 15 words: {text_to_summarize}"""
)

summary_chain = summary_prompt | llm_text_insights

summary_chain_wrapped = RunnableLambda(lambda x: {
    "text_to_summarize": x["text"]
}) | summary_chain

kw_prompt = PromptTemplate.from_template(
    """You are an expert contact center operations agent and analyst at a banking firm.
    Your task is to extract significant insight and information from customer messages. To do this, extract the top 8 most important and relevant keywords.
    Focus on single words (1-gram). If a short phrase (2-3 words) is exceptionally important and captures a key concept better than individual words, you may include it. Provide the keywords as a comma-separated list.
    Take note that the messages come from customers interacting with a bank.
    If you encounter a list of messages that looks like a customer-chatbot interaction signified by "User:" and "Chatbot:" in the message, extract the keywords in such a way that captures the essence of, or synthesizes, their conversation.

    Extract at most 4 most important and relevant keywords from the following message. Output as a comma-separated list.
    Message: {text_to_extract}"""
)

kw_chain = kw_prompt | llm_text_insights

kw_chain_wrapped = RunnableLambda(lambda x: {
    "text_to_extract": x["text"]
}) | kw_chain


dialogue_history_prompt = PromptTemplate(
    template = """You are an expert dialogue analyst for banking contact center operations. Your task is to extract and structure dialogue history with high accuracy and consistency.

    SPEAKER IDENTIFICATION GUIDELINES
    - **Receiver**: The representative, customer service agent, or automated system. This can only take two possible answers 'Bank Agent' or 'Chatbot'
    - **Customer**: The person calling or contacting the bank
    - If the text contains "User" and "Chatbot" indicators, then use 'Chatbot' for the Receiver, otherwise, use 'Bank Agent'

    TURN PROCESSING GUIDELINES
      **Sequential Numbering**: Assign turn_id starting from 1, incrementing by 1 for each speaker change
      **Speaker Consistency**: Maintain consistent speaker labels throughout the conversation
      **Message Integrity**: Capture complete thoughts, even if they span multiple sentences
      **Error Handling**: If unclear who is speaking, analyze context clues:
        - Greetings typically come from agents
        - Questions about personal info come from agents
        - Requests for services come from customers

    EXTRACTION CHECKS
    Before finalizing dialogue_history, verify:
    - No duplicate turn_ids
    - No missing turns in sequence
    - Speaker labels are consistent

    Output the format as follows:

    {format_instructions}

    Extract the history of the following text: {sample_text}.
    """,
    input_variables=["sample_text"],
    partial_variables={"format_instructions": dialogue_history_parser.get_format_instructions()})

dialogue_history_chain = dialogue_history_prompt | llm_text_insights

dialogue_history_chain_wrapped = RunnableLambda(lambda x: {
    "sample_text": x["text"]
}) | dialogue_history_chain | RunnableLambda(lambda x: dialogue_history_parser.parse(x.content).model_dump_json(indent=2))


def process_text_to_insight(text, sleep_time_req = 5):
  try:
    result = {}

    result['case_transaction_type'] = ctt_chain_wrapped.invoke({'text': text}).content.strip()
    time.sleep(sleep_time_req)

    result['case_priority_level'] = cpl_chain_wrapped.invoke({'text': text})
    time.sleep(sleep_time_req)

    result['case_type'] = ct_chain_wrapped.invoke({'text': text}).content.strip()
    time.sleep(sleep_time_req)

    result['sentiment'] = sentiment_chain_wrapped.invoke({'text': text})
    time.sleep(sleep_time_req)

    result['summary'] = summary_chain_wrapped.invoke({'text': text}).content.strip()
    time.sleep(sleep_time_req)

    result['keywords'] = kw_chain_wrapped.invoke({'text': text}).content.strip()

    result['dialogue_history'] = dialogue_history_chain_wrapped.invoke({'text': text})

  except Exception as e:
    tqdm.write(f"[error] Skipping row due to: {e}")
    result = {
        "case_text": text,
        "case_transaction_type": None,
        "case_priority_level": None,
        "case_type": None,
        "sentiment": None,
        "summary": None,
        "keywords": None,
        "dialogue_history": None
    }
  return result