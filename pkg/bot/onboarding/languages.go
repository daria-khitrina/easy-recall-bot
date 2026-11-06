package onboarding

// LanguageOptions controls both allowed languages and their display order.
var LanguageOptions = []Language{
	{Code: "en", Label: "🇬🇧 English"},
	{Code: "de", Label: "🇩🇪 German"},
}

type Language struct {
	Code  string
	Label string
}

var languageByCode = buildLanguageByCode()

func buildLanguageByCode() map[string]Language {
	out := make(map[string]Language, len(LanguageOptions))
	for _, option := range LanguageOptions {
		out[option.Code] = option
	}
	return out
}

func SupportedLanguageCodes() []string {
	codes := make([]string, 0, len(LanguageOptions))
	for _, option := range LanguageOptions {
		codes = append(codes, option.Code)
	}
	return codes
}

func IsSupportedLanguage(code string) bool {
	_, ok := languageByCode[code]
	return ok
}

func LabelForLanguage(code string) string {
	option, ok := languageByCode[code]
	if !ok {
		return code
	}
	return option.Label
}
