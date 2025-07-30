require_relative './markdownify_yaml.rb'

module UITemplate
  include MarkdownifyYAML

  def create_chart_body(chart_id, chart_title, chart_caption, chart_type, chart_markdown, chart_data_table_unit)
    case chart_type
      when 'Stacked Horizontal Bar'
        "<div class=\"chart-container\" id=\"#{Jekyll::Utils.slugify(chart_title, :mode => nil)}-#{chart_id}\" data-unit=\"#{chart_data_table_unit}\">
          <h4 class=\"chart-title\">#{chart_title}</h4>
          <div class=\"d3-chart d3-horizontal-bar-chart markdown-table\" id=\"chart-#{Jekyll::Utils.slugify(chart_title, :mode => nil)}-#{chart_id}\">
          </div>
          <div class=\"d3-chart-caption\">#{chart_caption}</div>
          <div class=\"table__body table__body--chart\" id=\"table-#{Jekyll::Utils.slugify(chart_title, :mode => nil)}-#{chart_id}\">#{markdownify_yaml(chart_markdown)}</div>
        </div>
        "
      when 'Stacked Vertical Bar'
        "<div class=\"chart-container\" id=\"#{Jekyll::Utils.slugify(chart_title, :mode => nil)}-#{chart_id}\" data-unit=\"#{chart_data_table_unit}\">
          <h4 class=\"chart-title\">#{chart_title}</h4>
          <div class=\"d3-chart d3-vertical-bar-chart markdown-table\" id=\"chart-#{Jekyll::Utils.slugify(chart_title, :mode => nil)}-#{chart_id}\">
          </div>
          <div class=\"d3-chart-caption\">#{chart_caption}</div>
          <div class=\"table__body table__body--chart\" id=\"table-#{Jekyll::Utils.slugify(chart_title, :mode => nil)}-#{chart_id}\">#{markdownify_yaml(chart_markdown)}</div>
        </div>
        "
      else
        puts "The chart type #{chart_type} is not yet supported"
      end
  end
  
  def create_footnote_html(footnote_id)
    "<sup tabindex=3 class=\"footnote\" id=#{footnote_id}></sup>"
  end

  def create_footnotes_panel(footnote_body, footnote_id)
    "<div class=\"footnote-container\" data-location=#{footnote_id}>
      <div class=\"row\">
        <div class=\"column large-1 small-1 medium-1\"><p class=\"footnote-numbers\">1</p></div>
        <div class=\"column large-10 small-10 medium-10\">#{markdownify_yaml(footnote_body)}</div>
      </div>
    </div>"
  end

  def create_figure_html(figure_id, title, image_url, image_description, caption)
    "<div class=\"figure\">
      <p class=\"figure__title\">#{title}</p>
      <img id=#{figure_id} class=\"figure__image\" src=#{image_url} alt=\"#{image_description.gsub(/"/,"'")}\" />
      <div class=\"figure__caption\">#{markdownify_yaml(caption)}</div>
    </div>"
  end

  def create_table(title, body, caption)
    "<div class=\"table\">
      <p class=\"table__title\">#{title}</p>
      <div class=\"table__body\">#{markdownify_yaml(body)}</div>
      <div class=\"table__caption\">#{markdownify_yaml(caption)}</div>
    </div>"
  end

  def create_quote_html(content, attribution)
    "<blockquote class=\"pull-quote\">
      <div class=\"quote\">#{markdownify_yaml(content)}</div>
      <div class=\"attribution\">#{markdownify_yaml(attribution)}</div>
    </blockquote>"
  end

  def create_box_html(title, image_url, alt_text, content)
    if image_url != 'No image available'
      "<div class=\"box\">
        <p class=\"box__title\">#{title}</p>
        <img class=\"box__image\" src=#{image_url} alt=\"#{alt_text}\" />
        <div class=\"box__content\">#{markdownify_yaml(content)}</div>
      </div>"
    else
      "<div class=\"box\">
        <p class=\"box__title\">#{title}</p>
        <div class=\"box__content\">#{markdownify_yaml(content)}</div>
      </div>"
    end
  end

  def create_iframe_html(body, caption)
    "<div class=\"product-code iframe\">#{body}</div>"
  end

  def create_code_html(title, body, caption)
    "<div class=\"code\">
      <p class=\"code__title\">#{title}</p>
      <div class=\"product-code iframe\">#{body}</div>
      <div class=\"code__caption\">#{markdownify_yaml(caption)}</div>
    </div>"
  end
end
